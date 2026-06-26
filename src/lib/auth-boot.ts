type AuthBootCoordinatorOptions<TSession> = {
  applySession: (session: TSession | null) => void;
  markReady: () => void;
};

export type AuthBootCoordinator<TSession> = {
  markTimedOut: () => void;
  resolveInitialSession: (session: TSession | null) => void;
  failInitialSession: () => void;
  applyAuthEvent: (session: TSession | null) => void;
};

export function createAuthBootCoordinator<TSession>({
  applySession,
  markReady,
}: AuthBootCoordinatorOptions<TSession>): AuthBootCoordinator<TSession> {
  let ready = false;
  let authEventSeen = false;

  const markReadyOnce = () => {
    if (ready) return;
    ready = true;
    markReady();
  };

  const applyInitialSession = (session: TSession | null) => {
    if (!authEventSeen) {
      applySession(session);
    }
    markReadyOnce();
  };

  return {
    markTimedOut: markReadyOnce,
    resolveInitialSession: applyInitialSession,
    failInitialSession: () => applyInitialSession(null),
    applyAuthEvent: (session) => {
      authEventSeen = true;
      applySession(session);
      markReadyOnce();
    },
  };
}
