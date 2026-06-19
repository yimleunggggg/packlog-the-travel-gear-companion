import { describe, expect, it } from "vitest";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

type TestSession = { user: { id: string } };

describe("createAuthBootCoordinator", () => {
  it("does not clear a session when boot times out", () => {
    const boot = createAuthBootCoordinator<TestSession>();

    expect(boot.applyTimeout()).toEqual({ ready: true });
    expect(boot.applyAuthEvent({ user: { id: "u1" } })).toEqual({
      ready: false,
      session: { user: { id: "u1" } },
    });
  });

  it("ignores stale getSession results after an auth event", () => {
    const boot = createAuthBootCoordinator<TestSession>();

    expect(boot.applyAuthEvent({ user: { id: "u1" } })).toEqual({
      ready: true,
      session: { user: { id: "u1" } },
    });
    expect(boot.applyInitialSession(null)).toEqual({ ready: false });
  });
});
