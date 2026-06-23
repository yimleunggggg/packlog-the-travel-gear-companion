type AuthBootCallbacks<TSession> = {
  applySession: (session: TSession | null) => void;
  markReady: () => void;
};

export function createAuthBootCoordinator<TSession>({
  applySession,
  markReady,
}: AuthBootCallbacks<TSession>) {
  let sawAuthEvent = false;

  return {
    handleTimeout() {
      markReady();
    },
    handleAuthEvent(session: TSession | null) {
      sawAuthEvent = true;
      applySession(session);
      markReady();
    },
    handleInitialSession(session: TSession | null) {
      if (!sawAuthEvent) {
        applySession(session);
      }
      markReady();
    },
    handleInitialError() {
      if (!sawAuthEvent) {
        applySession(null);
      }
      markReady();
    },
  };
}
