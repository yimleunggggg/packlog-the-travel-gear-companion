import { describe, expect, it } from "vitest";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

type TestSession = { userId: string };

function createRecorder() {
  const events: string[] = [];
  const boot = createAuthBootCoordinator<TestSession>({
    applySession: (session) => events.push(`session:${session?.userId ?? "null"}`),
    markReady: () => events.push("ready"),
  });

  return { boot, events };
}

describe("createAuthBootCoordinator", () => {
  it("does not let a stale initial session overwrite an auth event", () => {
    const { boot, events } = createRecorder();

    boot.applyAuthEvent({ userId: "signed-in" });
    boot.resolveInitialSession(null);

    expect(events).toEqual(["session:signed-in", "ready"]);
  });

  it("marks auth ready on timeout without applying an anonymous session", () => {
    const { boot, events } = createRecorder();

    boot.markTimedOut();
    boot.resolveInitialSession({ userId: "late-session" });

    expect(events).toEqual(["ready", "session:late-session"]);
  });

  it("ignores an initial-session failure after an auth event", () => {
    const { boot, events } = createRecorder();

    boot.applyAuthEvent({ userId: "event-session" });
    boot.failInitialSession();

    expect(events).toEqual(["session:event-session", "ready"]);
  });
});
