export type AuthBootCoordinatorOptions<TSession> = {
  applySession: (session: TSession | null) => void;
  markReady: () => void;
};

export type AuthBootCoordinator<TSession> = {
  initialSessionResolved: (session: TSession | null) => void;
  initialSessionFailed: () => void;
  authStateChanged: (session: TSession | null) => void;
  timedOut: () => void;
  cancel: () => void;
};

export function createAuthBootCoordinator<TSession>({
  applySession,
  markReady,
}: AuthBootCoordinatorOptions<TSession>): AuthBootCoordinator<TSession> {
  let cancelled = false;
  let authEventSeen = false;
  let ready = false;

  const finishReady = () => {
    if (cancelled || ready) return;
    ready = true;
    markReady();
  };

  return {
    initialSessionResolved: (session) => {
      if (cancelled) return;
      if (!authEventSeen) applySession(session);
      finishReady();
    },
    initialSessionFailed: () => {
      finishReady();
    },
    authStateChanged: (session) => {
      if (cancelled) return;
      authEventSeen = true;
      applySession(session);
      finishReady();
    },
    timedOut: () => {
      finishReady();
    },
    cancel: () => {
      cancelled = true;
    },
  };
}
