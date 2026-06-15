import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import {
  markAuthBootTimedOut,
  resolveAuthStateBootEvent,
  resolveGetSessionBootResult,
  type AuthBootTracker,
} from "./auth-boot";

const session = { user: { id: "user-1" } } as Session;

describe("auth boot tracking", () => {
  it("does not apply stale getSession results after an auth event", () => {
    const tracker: AuthBootTracker = { timedOut: false, authEventSeen: false };

    const eventApplication = resolveAuthStateBootEvent(tracker, "SIGNED_IN", session);
    const getSessionApplication = resolveGetSessionBootResult(tracker, null);

    expect(eventApplication).toEqual({ session, suppressResume: false });
    expect(getSessionApplication).toBeNull();
  });

  it("marks late cold-start sessions after timeout so resume intents are not replayed", () => {
    const tracker: AuthBootTracker = { timedOut: false, authEventSeen: false };
    markAuthBootTimedOut(tracker);

    expect(resolveGetSessionBootResult(tracker, session)).toEqual({
      session,
      suppressResume: true,
    });
  });

  it("does not suppress a real sign-in event after the boot timeout", () => {
    const tracker: AuthBootTracker = { timedOut: false, authEventSeen: false };
    markAuthBootTimedOut(tracker);

    expect(resolveAuthStateBootEvent(tracker, "SIGNED_IN", session)).toEqual({
      session,
      suppressResume: false,
    });
  });

  it("suppresses a late initial-session event after the boot timeout", () => {
    const tracker: AuthBootTracker = { timedOut: false, authEventSeen: false };
    markAuthBootTimedOut(tracker);

    expect(resolveAuthStateBootEvent(tracker, "INITIAL_SESSION", session)).toEqual({
      session,
      suppressResume: true,
    });
  });
});
