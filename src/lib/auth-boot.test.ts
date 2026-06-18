import { describe, expect, it } from "vitest";
import { createAuthBootCoordinator, type AuthBootState } from "@/lib/auth-boot";

type TestSession = { user: { id: string } };

function collectStates() {
  const states: AuthBootState<TestSession>[] = [];
  const boot = createAuthBootCoordinator<TestSession>((state) => {
    states.push(state);
  });
  return { boot, states };
}

describe("createAuthBootCoordinator", () => {
  it("does not let a boot timeout erase a session received from an auth event", () => {
    const { boot, states } = collectStates();
    const signedIn = { user: { id: "user-1" } };

    boot.applyAuthEvent(signedIn);
    boot.markBootTimedOut();

    expect(states.at(-1)).toEqual({ session: signedIn, ready: true });
  });

  it("accepts a slow getSession result after the UI has been marked ready", () => {
    const { boot, states } = collectStates();
    const signedIn = { user: { id: "user-1" } };

    boot.markBootTimedOut();
    boot.applyBootSession(signedIn);

    expect(states).toEqual([
      { session: null, ready: true },
      { session: signedIn, ready: true },
    ]);
  });

  it("ignores stale getSession results after an auth event has supplied the current session", () => {
    const { boot, states } = collectStates();
    const signedIn = { user: { id: "user-1" } };

    boot.applyAuthEvent(signedIn);
    boot.applyBootSession(null);
    boot.applyBootFailure();

    expect(states.at(-1)).toEqual({ session: signedIn, ready: true });
  });
});
