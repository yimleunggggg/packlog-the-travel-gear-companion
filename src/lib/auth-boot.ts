import type { Session } from "@supabase/supabase-js";

type AuthBootCoordinatorOptions = {
  applySession: (session: Session | null) => void;
  markReady: () => void;
};

export type AuthBootCoordinator = {
  resolveInitialSession: (session: Session | null) => void;
  rejectInitialSession: () => void;
  receiveAuthEvent: (session: Session | null) => void;
  timeout: () => void;
  cancel: () => void;
};

export function createAuthBootCoordinator({
  applySession,
  markReady,
}: AuthBootCoordinatorOptions): AuthBootCoordinator {
  let cancelled = false;
  let ready = false;
  let sawAuthEvent = false;

  const markBootReady = () => {
    if (cancelled || ready) return;
    ready = true;
    markReady();
  };

  const apply = (session: Session | null) => {
    if (cancelled) return;
    applySession(session);
  };

  return {
    resolveInitialSession: (session) => {
      if (!sawAuthEvent) apply(session);
      markBootReady();
    },
    rejectInitialSession: () => {
      markBootReady();
    },
    receiveAuthEvent: (session) => {
      sawAuthEvent = true;
      apply(session);
      markBootReady();
    },
    timeout: () => {
      markBootReady();
    },
    cancel: () => {
      cancelled = true;
    },
  };
}
