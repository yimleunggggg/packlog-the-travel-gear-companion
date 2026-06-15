import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export type AuthBootTracker = {
  timedOut: boolean;
  authEventSeen: boolean;
};

export type AuthBootSessionApplication = {
  session: Session | null;
  suppressResume: boolean;
};

export function markAuthBootTimedOut(tracker: AuthBootTracker) {
  tracker.timedOut = true;
}

export function resolveGetSessionBootResult(
  tracker: AuthBootTracker,
  session: Session | null,
): AuthBootSessionApplication | null {
  if (tracker.authEventSeen) return null;
  return {
    session,
    suppressResume: tracker.timedOut && Boolean(session),
  };
}

export function resolveAuthStateBootEvent(
  tracker: AuthBootTracker,
  event: AuthChangeEvent,
  session: Session | null,
): AuthBootSessionApplication {
  tracker.authEventSeen = true;
  return {
    session,
    suppressResume: tracker.timedOut && event === "INITIAL_SESSION" && Boolean(session),
  };
}
