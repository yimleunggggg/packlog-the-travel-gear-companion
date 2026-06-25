import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createAuthBootCoordinator } from "./auth-boot";

function sessionFor(userId: string): Session {
  return { user: { id: userId } } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("does not let the timeout clear a session from an auth event", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.handleAuthEvent(sessionFor("user-a"));
    boot.handleTimeout();

    expect(applied).toEqual(["user-a"]);
    expect(readyCount).toBe(1);
  });

  it("ignores a stale initial null session after an auth event", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.handleAuthEvent(sessionFor("user-a"));
    boot.handleInitialSession(null);

    expect(applied).toEqual(["user-a"]);
    expect(readyCount).toBe(1);
  });

  it("keeps accepting a late initial session after timeout only marked ready", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.handleTimeout();
    boot.handleInitialSession(sessionFor("user-a"));

    expect(applied).toEqual(["user-a"]);
    expect(readyCount).toBe(1);
  });
});
