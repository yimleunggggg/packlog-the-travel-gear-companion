export type AuthBootState<SessionLike> = {
  session: SessionLike | null;
  ready: boolean;
};

type ApplyAuthBootState<SessionLike> = (state: AuthBootState<SessionLike>) => void;

export function createAuthBootCoordinator<SessionLike>(
  applyState: ApplyAuthBootState<SessionLike>,
) {
  let cancelled = false;
  let ready = false;
  let authEventSeen = false;
  let session: SessionLike | null = null;

  const emit = () => {
    if (cancelled) return;
    applyState({ session, ready });
  };

  const markReady = () => {
    if (ready) return;
    ready = true;
    emit();
  };

  return {
    applyBootSession(nextSession: SessionLike | null) {
      if (cancelled) return;
      if (!authEventSeen) {
        session = nextSession;
        ready = true;
        emit();
        return;
      }
      markReady();
    },
    applyBootFailure() {
      if (cancelled) return;
      if (!authEventSeen) session = null;
      markReady();
    },
    applyAuthEvent(nextSession: SessionLike | null) {
      if (cancelled) return;
      authEventSeen = true;
      session = nextSession;
      if (!ready) ready = true;
      emit();
    },
    markBootTimedOut() {
      markReady();
    },
    cancel() {
      cancelled = true;
    },
  };
}
