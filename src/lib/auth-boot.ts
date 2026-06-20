import type { Session } from "@supabase/supabase-js";

type AuthBootCallbacks = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

/**
 * Coordinates Supabase cold-start signals so a timeout can unblock the UI
 * without erasing a session that arrives through auth state events.
 */
export function createAuthBootCoordinator({ applySession, markReady }: AuthBootCallbacks) {
  let disposed = false;
  let authEventSeen = false;

  const ready = () => {
    if (!disposed) markReady();
  };

  const applyIfCurrent = (session: Session | null) => {
    if (disposed) return;
    applySession(session);
  };

  return {
    timeout() {
      ready();
    },
    getSessionResolved(session: Session | null) {
      if (!authEventSeen) applyIfCurrent(session);
      ready();
    },
    getSessionRejected() {
      if (!authEventSeen) applyIfCurrent(null);
      ready();
    },
    authStateChanged(session: Session | null) {
      authEventSeen = true;
      applyIfCurrent(session);
      ready();
    },
    dispose() {
      disposed = true;
    },
  };
}
