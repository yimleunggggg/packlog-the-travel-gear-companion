import type { Session } from "@supabase/supabase-js";

type AuthBootHandlers = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export function createAuthBootCoordinator({ applySession, markReady }: AuthBootHandlers) {
  let sawAuthEvent = false;
  let ready = false;

  const markReadyOnce = () => {
    if (ready) return;
    ready = true;
    markReady();
  };

  return {
    handleAuthEvent(session: Session | null) {
      sawAuthEvent = true;
      applySession(session);
      markReadyOnce();
    },
    handleInitialSession(session: Session | null) {
      if (!sawAuthEvent) {
        applySession(session);
      }
      markReadyOnce();
    },
    handleInitialError() {
      if (!sawAuthEvent) {
        applySession(null);
      }
      markReadyOnce();
    },
    handleTimeout() {
      markReadyOnce();
    },
  };
}
