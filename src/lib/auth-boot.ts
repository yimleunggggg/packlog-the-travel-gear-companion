import type { Session } from "@supabase/supabase-js";

type AuthBootCoordinatorOptions = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export function createAuthBootCoordinator({ applySession, markReady }: AuthBootCoordinatorOptions) {
  let cancelled = false;
  let sawAuthEvent = false;
  let ready = false;

  const finishReady = () => {
    if (cancelled || ready) return;
    ready = true;
    markReady();
  };

  return {
    authStateChanged(nextSession: Session | null) {
      if (cancelled) return;
      sawAuthEvent = true;
      applySession(nextSession);
      finishReady();
    },
    getSessionResolved(nextSession: Session | null) {
      if (cancelled) return;
      if (!sawAuthEvent) {
        applySession(nextSession);
      }
      finishReady();
    },
    getSessionFailed() {
      if (cancelled) return;
      if (!sawAuthEvent) {
        applySession(null);
      }
      finishReady();
    },
    timeout() {
      finishReady();
    },
    cancel() {
      cancelled = true;
    },
  };
}
