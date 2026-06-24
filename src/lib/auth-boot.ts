import type { Session } from "@supabase/supabase-js";

type AuthBootHandlers = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export type AuthBootCoordinator = {
  finishInitialSession: (session: Session | null) => void;
  failInitialSession: () => void;
  authStateChanged: (session: Session | null) => void;
  timeout: () => void;
  cancel: () => void;
};

export function createAuthBootCoordinator(handlers: AuthBootHandlers): AuthBootCoordinator {
  let cancelled = false;
  let ready = false;
  let authEventSeen = false;

  const markReadyOnce = () => {
    if (cancelled || ready) return;
    ready = true;
    handlers.markReady();
  };

  const applySession = (session: Session | null) => {
    if (cancelled) return;
    handlers.applySession(session);
    markReadyOnce();
  };

  return {
    finishInitialSession: (session) => {
      if (authEventSeen) {
        markReadyOnce();
        return;
      }
      applySession(session);
    },
    failInitialSession: () => {
      if (authEventSeen) {
        markReadyOnce();
        return;
      }
      applySession(null);
    },
    authStateChanged: (session) => {
      authEventSeen = true;
      applySession(session);
    },
    timeout: () => {
      markReadyOnce();
    },
    cancel: () => {
      cancelled = true;
    },
  };
}
