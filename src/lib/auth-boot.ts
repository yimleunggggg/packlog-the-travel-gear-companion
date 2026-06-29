export type AuthBootCoordinator<TSession> = {
  applyAuthEvent: (session: TSession | null) => void;
  applyInitialSession: (session: TSession | null) => void;
  failInitialSession: () => void;
  timeout: () => void;
  dispose: () => void;
};

export function createAuthBootCoordinator<TSession>({
  applySession,
  markReady,
}: {
  applySession: (session: TSession | null) => void;
  markReady: () => void;
}): AuthBootCoordinator<TSession> {
  let disposed = false;
  let ready = false;
  let sawAuthEvent = false;

  const ensureReady = () => {
    if (ready || disposed) return;
    ready = true;
    markReady();
  };

  return {
    applyAuthEvent: (session) => {
      if (disposed) return;
      sawAuthEvent = true;
      applySession(session);
      ensureReady();
    },
    applyInitialSession: (session) => {
      if (disposed) return;
      if (!sawAuthEvent) {
        applySession(session);
      }
      ensureReady();
    },
    failInitialSession: () => {
      ensureReady();
    },
    timeout: () => {
      ensureReady();
    },
    dispose: () => {
      disposed = true;
    },
  };
}
