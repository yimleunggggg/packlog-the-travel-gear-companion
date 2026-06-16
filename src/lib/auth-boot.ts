import type { Session } from "@supabase/supabase-js";

type AuthBootCoordinatorOptions = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export function createAuthBootCoordinator({ applySession, markReady }: AuthBootCoordinatorOptions) {
  let cancelled = false;
  let authEventSeen = false;
  let readyMarked = false;

  const safeMarkReady = () => {
    if (cancelled || readyMarked) return;
    readyMarked = true;
    markReady();
  };

  const safeApplySession = (session: Session | null) => {
    if (cancelled) return;
    applySession(session);
  };

  return {
    applyAuthEvent(session: Session | null) {
      authEventSeen = true;
      safeApplySession(session);
      safeMarkReady();
    },
    finishGetSession(session: Session | null) {
      if (!authEventSeen) safeApplySession(session);
      safeMarkReady();
    },
    failGetSession() {
      safeMarkReady();
    },
    timeout() {
      safeMarkReady();
    },
    cancel() {
      cancelled = true;
    },
  };
}
