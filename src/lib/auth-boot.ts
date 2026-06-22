import type { Session } from "@supabase/supabase-js";

type AuthBootCoordinatorOptions = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export type AuthBootCoordinator = {
  fromGetSession: (session: Session | null) => void;
  fromAuthStateChange: (session: Session | null) => void;
  timeout: () => void;
  cancel: () => void;
};

export function createAuthBootCoordinator({
  applySession,
  markReady,
}: AuthBootCoordinatorOptions): AuthBootCoordinator {
  let cancelled = false;
  let ready = false;
  let authEventSeen = false;

  const complete = () => {
    if (ready) return;
    ready = true;
    markReady();
  };

  const apply = (session: Session | null) => {
    applySession(session);
  };

  return {
    fromGetSession: (session) => {
      if (cancelled) return;
      if (!authEventSeen) apply(session);
      complete();
    },
    fromAuthStateChange: (session) => {
      if (cancelled) return;
      authEventSeen = true;
      apply(session);
      complete();
    },
    timeout: () => {
      if (cancelled) return;
      complete();
    },
    cancel: () => {
      cancelled = true;
    },
  };
}
