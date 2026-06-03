export type AuthBootState<TSession> = {
  session: TSession | null;
  ready: boolean;
  authEventSeen: boolean;
};

export function initialAuthBootState<TSession>(): AuthBootState<TSession> {
  return {
    session: null,
    ready: false,
    authEventSeen: false,
  };
}

export function applyAuthStateEvent<TSession>(
  _state: AuthBootState<TSession>,
  nextSession: TSession | null,
): AuthBootState<TSession> {
  return {
    session: nextSession,
    ready: true,
    authEventSeen: true,
  };
}

export function applyInitialSessionResult<TSession>(
  state: AuthBootState<TSession>,
  nextSession: TSession | null,
): AuthBootState<TSession> {
  if (state.authEventSeen) {
    return { ...state, ready: true };
  }

  return {
    ...state,
    session: nextSession,
    ready: true,
  };
}

export function markAuthBootReady<TSession>(
  state: AuthBootState<TSession>,
): AuthBootState<TSession> {
  return {
    ...state,
    ready: true,
  };
}
