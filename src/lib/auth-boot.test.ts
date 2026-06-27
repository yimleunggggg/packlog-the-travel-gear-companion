import type { Session } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createAuthBootCoordinator } from "./auth-boot";

function sessionFor(userId: string): Session {
  return { user: { id: userId } } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("ignores a stale initial session result after an auth event arrives", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.applyAuthEvent(sessionFor("user-live"));
    boot.applyInitialSession(null);

    expect(applied).toEqual(["user-live"]);
    expect(readyCount).toBe(1);
  });

  it("lets a late initial session apply after the timeout only marks boot ready", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.markTimedOut();
    boot.applyInitialSession(sessionFor("user-slow"));

    expect(applied).toEqual(["user-slow"]);
    expect(readyCount).toBe(1);
  });

  it("continues applying later auth events after the initial session resolves", () => {
    const applied: Array<string | null> = [];
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {},
    });

    boot.applyInitialSession(sessionFor("user-cold"));
    boot.applyAuthEvent(null);

    expect(applied).toEqual(["user-cold", null]);
  });
});
