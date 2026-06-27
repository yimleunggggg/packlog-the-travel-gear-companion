import type { Session } from "@supabase/supabase-js";

type AuthBootCoordinatorOptions = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export function createAuthBootCoordinator({ applySession, markReady }: AuthBootCoordinatorOptions) {
  let authEventSeen = false;
  let readyMarked = false;

  const markReadyOnce = () => {
    if (readyMarked) return;
    readyMarked = true;
    markReady();
  };

  return {
    markTimedOut() {
      markReadyOnce();
    },
    applyInitialSession(session: Session | null) {
      if (!authEventSeen) {
        applySession(session);
      }
      markReadyOnce();
    },
    applyAuthEvent(session: Session | null) {
      authEventSeen = true;
      applySession(session);
      markReadyOnce();
    },
  };
}
