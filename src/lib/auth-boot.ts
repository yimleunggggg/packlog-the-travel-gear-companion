import type { Session } from "@supabase/supabase-js";

type AuthBootHandlers = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export function createAuthBootCoordinator({ applySession, markReady }: AuthBootHandlers) {
  let disposed = false;
  let ready = false;
  let authEventSeen = false;

  const markReadyOnce = () => {
    if (disposed || ready) return;
    ready = true;
    markReady();
  };

  const applyIfActive = (session: Session | null) => {
    if (disposed) return;
    applySession(session);
  };

  return {
    handleInitialSession(session: Session | null) {
      if (disposed) return;
      if (!authEventSeen) applyIfActive(session);
      markReadyOnce();
    },
    handleInitialError() {
      if (disposed) return;
      if (!authEventSeen) applyIfActive(null);
      markReadyOnce();
    },
    handleAuthEvent(session: Session | null) {
      if (disposed) return;
      authEventSeen = true;
      applyIfActive(session);
      markReadyOnce();
    },
    handleTimeout() {
      markReadyOnce();
    },
    dispose() {
      disposed = true;
    },
  };
}
