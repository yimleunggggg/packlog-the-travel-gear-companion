import { describe, expect, it } from "vitest";
import {
  applyAuthStateEvent,
  applyInitialSessionResult,
  initialAuthBootState,
  markAuthBootReady,
} from "@/lib/auth-boot";

type TestSession = {
  user: {
    id: string;
  };
};

function sessionFor(userId: string): TestSession {
  return { user: { id: userId } };
}

describe("auth boot state", () => {
  it("keeps an auth event session when the boot timeout fires later", () => {
    let state = initialAuthBootState<TestSession>();
    state = applyAuthStateEvent(state, sessionFor("user-1"));
    state = markAuthBootReady(state);

    expect(state.ready).toBe(true);
    expect(state.session?.user.id).toBe("user-1");
  });

  it("ignores stale getSession results after auth state has already changed", () => {
    let state = initialAuthBootState<TestSession>();
    state = applyAuthStateEvent(state, sessionFor("user-1"));
    state = applyInitialSessionResult(state, null);

    expect(state.ready).toBe(true);
    expect(state.session?.user.id).toBe("user-1");
  });

  it("does not resurrect a stale session after a sign-out event", () => {
    let state = initialAuthBootState<TestSession>();
    state = applyAuthStateEvent(state, sessionFor("user-1"));
    state = applyAuthStateEvent(state, null);
    state = applyInitialSessionResult(state, sessionFor("user-1"));

    expect(state.ready).toBe(true);
    expect(state.session).toBeNull();
  });

  it("uses getSession when no auth event has arrived", () => {
    let state = initialAuthBootState<TestSession>();
    state = applyInitialSessionResult(state, sessionFor("user-1"));

    expect(state.ready).toBe(true);
    expect(state.session?.user.id).toBe("user-1");
  });
});
