export type AuthBootUpdateSource =
  | "auth-event"
  | "get-session-success"
  | "get-session-error"
  | "timeout";

export type AuthBootUpdate = {
  applySession: boolean;
  markReady: boolean;
};

/**
 * Supabase may emit INITIAL_SESSION before getSession() settles. Network timeouts
 * should unblock the UI, but must not erase a session already learned from auth events.
 */
export function resolveAuthBootUpdate(
  source: AuthBootUpdateSource,
  getSessionStartedAtAuthRevision: number,
  currentAuthRevision: number,
): AuthBootUpdate {
  if (source === "auth-event") {
    return { applySession: true, markReady: true };
  }

  if (source === "get-session-success") {
    return {
      applySession: getSessionStartedAtAuthRevision === currentAuthRevision,
      markReady: true,
    };
  }

  return { applySession: false, markReady: true };
}
