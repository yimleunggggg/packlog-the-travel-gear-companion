import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { LoginSheet } from "@/components/auth/LoginSheet";
import {
  clearPostAuthIntent,
  consumePostAuthIntent,
  peekPostAuthIntent,
  POST_AUTH_EVENT,
  storePostAuthIntent,
  type PostAuthIntent,
} from "@/lib/post-auth-intent";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-client";

/** OAuth 返回后写入 `marketing_opt_in`；短时 TTL 防止未完成登录的残留意图误套用到下一次登录 */
const OAUTH_MARKETING_INTENT_KEY = "packlog.oauth_marketing_intent";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  ready: boolean;
  /** Supabase env missing — auth UI disabled. */
  authConfigured: boolean;
  signInWithOtp: (
    email: string,
    opts?: { marketingOptIn?: boolean },
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (opts?: { marketingOptIn?: boolean }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /**
   * Run immediately if signed in; otherwise open login sheet.
   * Pass `resume` so magic link / OAuth can resume after redirect.
   */
  requestAuth: (action: () => void | Promise<void>, resume?: PostAuthIntent) => void;
  /** Open login sheet only (e.g. header “登录”) — clears pending resume intents. */
  openLoginUi: () => void;
  closeLoginSheet: () => void;
  loginSheetOpen: boolean;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

function authCallbackUrl(next?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = "/auth/callback";
  if (!next || next === "/") return `${origin}${path}`;
  return `${origin}${path}?next=${encodeURIComponent(next)}`;
}

function dispatchResume(intent: PostAuthIntent) {
  window.dispatchEvent(new CustomEvent<PostAuthIntent>(POST_AUTH_EVENT, { detail: intent }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const pendingSyncAction = useRef<(() => void | Promise<void>) | null>(null);
  const readyBoot = useRef(false);
  const prevUserRef = useRef<User | null>(null);

  const authConfigured = hasSupabaseBrowserConfig();

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const finishBoot = (nextSession: Session | null) => {
      if (cancelled) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setReady(true);
    };

    /** 弱网/墙内 Supabase 慢或挂起时，避免 AuthGate 永久 disabled。 */
    const bootTimer = window.setTimeout(() => finishBoot(null), 8000);

    client.auth
      .getSession()
      .then(({ data }) => {
        window.clearTimeout(bootTimer);
        finishBoot(data.session);
      })
      .catch(() => {
        window.clearTimeout(bootTimer);
        finishBoot(null);
      });

    const { data: sub } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Google OAuth：登录前把订阅意向暂存 localStorage，回调落盘后写入 user_metadata（魔法链接走 signInWithOtp 的 data） */
  useEffect(() => {
    if (!ready || !user) return;
    const client = getSupabaseBrowserClient();
    if (!client || typeof window === "undefined") return;

    const raw = window.localStorage.getItem(OAUTH_MARKETING_INTENT_KEY);
    if (!raw) return;

    let parsed: { optIn?: boolean; exp?: number };
    try {
      parsed = JSON.parse(raw) as { optIn?: boolean; exp?: number };
    } catch {
      window.localStorage.removeItem(OAUTH_MARKETING_INTENT_KEY);
      return;
    }

    if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) {
      window.localStorage.removeItem(OAUTH_MARKETING_INTENT_KEY);
      return;
    }

    const want = Boolean(parsed.optIn);
    window.localStorage.removeItem(OAUTH_MARKETING_INTENT_KEY);

    const cur = user.user_metadata?.marketing_opt_in;
    if (cur === want) return;

    void client.auth.updateUser({ data: { marketing_opt_in: want } });
  }, [ready, user]);

  /** Resume flows only when user transitions from signed-out → signed-in (skip cold load with existing session). */
  useEffect(() => {
    if (!ready) return;
    if (!readyBoot.current) {
      readyBoot.current = true;
      prevUserRef.current = user;
      if (user && peekPostAuthIntent()) {
        const intent = consumePostAuthIntent();
        if (intent) {
          setLoginSheetOpen(false);
          dispatchResume(intent);
        }
      }
      return;
    }
    const prev = prevUserRef.current;
    prevUserRef.current = user;
    if (!user || prev) return;

    if (pendingSyncAction.current) {
      const fn = pendingSyncAction.current;
      pendingSyncAction.current = null;
      clearPostAuthIntent();
      setLoginSheetOpen(false);
      void Promise.resolve(fn());
      return;
    }
    const intent = consumePostAuthIntent();
    if (intent) dispatchResume(intent);
  }, [ready, user]);

  const closeLoginSheet = useCallback(() => {
    clearPostAuthIntent();
    pendingSyncAction.current = null;
    setLoginSheetOpen(false);
  }, []);

  const openLoginUi = useCallback(() => {
    pendingSyncAction.current = null;
    clearPostAuthIntent();
    setLoginSheetOpen(true);
  }, []);

  const requestAuth = useCallback(
    (action: () => void | Promise<void>, resume?: PostAuthIntent) => {
      /** 未配置 Supabase 时走纯本地模式：不弹登录，直接执行动作（与已登录用户一致）。 */
      if (!authConfigured) {
        void Promise.resolve(action());
        return;
      }
      if (user) {
        void Promise.resolve(action());
        return;
      }
      if (resume) storePostAuthIntent(resume);
      pendingSyncAction.current = action;
      setLoginSheetOpen(true);
    },
    [authConfigured, user],
  );

  const signInWithOtp = useCallback(async (email: string, opts?: { marketingOptIn?: boolean }) => {
    const client = getSupabaseBrowserClient();
    if (!client) return { error: new Error("Supabase not configured") };
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(OAUTH_MARKETING_INTENT_KEY);
    }
    const marketingOptIn = Boolean(opts?.marketingOptIn);
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: authCallbackUrl(),
        data: {
          marketing_opt_in: marketingOptIn,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithGoogle = useCallback(async (opts?: { marketingOptIn?: boolean }) => {
    const client = getSupabaseBrowserClient();
    if (!client) return { error: new Error("Supabase not configured") };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        OAUTH_MARKETING_INTENT_KEY,
        JSON.stringify({
          optIn: Boolean(opts?.marketingOptIn),
          exp: Date.now() + 15 * 60 * 1000,
        }),
      );
    }
    const next =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/";
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(next),
      },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    pendingSyncAction.current = null;
    clearPostAuthIntent();
    if (!client) return;
    await client.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      ready,
      authConfigured,
      signInWithOtp,
      signInWithGoogle,
      signOut,
      requestAuth,
      openLoginUi,
      closeLoginSheet,
      loginSheetOpen,
    }),
    [
      user,
      session,
      ready,
      authConfigured,
      signInWithOtp,
      signInWithGoogle,
      signOut,
      requestAuth,
      openLoginUi,
      closeLoginSheet,
      loginSheetOpen,
    ],
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
      <LoginSheet
        open={loginSheetOpen}
        onClose={closeLoginSheet}
        signInWithOtp={signInWithOtp}
        signInWithGoogle={signInWithGoogle}
        authConfigured={authConfigured}
      />
    </AuthCtx.Provider>
  );
}

/** @see AuthProvider — exported hook must live alongside provider in this module. */
// eslint-disable-next-line react-refresh/only-export-components -- hook pairs with AuthProvider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
