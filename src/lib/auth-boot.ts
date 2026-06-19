type AuthBootResult<TSession> = {
  ready: boolean;
  session?: TSession | null;
};

export function createAuthBootCoordinator<TSession>() {
  let ready = false;
  let authEventSeen = false;

  const markReady = () => {
    const shouldMarkReady = !ready;
    ready = true;
    return shouldMarkReady;
  };

  return {
    applyInitialSession(session: TSession | null): AuthBootResult<TSession> {
      if (authEventSeen) {
        return { ready: markReady() };
      }
      return { ready: markReady(), session };
    },
    applyAuthEvent(session: TSession | null): AuthBootResult<TSession> {
      authEventSeen = true;
      return { ready: markReady(), session };
    },
    applyTimeout(): AuthBootResult<TSession> {
      return { ready: markReady() };
    },
  };
}
