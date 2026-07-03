import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

function sessionFor(userId: string): Session {
  return { user: { id: userId } } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("does not let a stale getSession result overwrite an auth event", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.authStateChanged(sessionFor("u1"));
    boot.getSessionResolved(null);

    expect(applied).toEqual(["u1"]);
    expect(readyCount).toBe(1);
  });

  it("marks auth ready on timeout without applying a null session", () => {
    const applied: Array<string | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.timeout();

    expect(applied).toEqual([]);
    expect(readyCount).toBe(1);
  });

  it("applies null only when getSession fails before any auth event", () => {
    const applied: Array<string | null> = [];
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session?.user.id ?? null),
      markReady: () => {},
    });

    boot.getSessionFailed();

    expect(applied).toEqual([null]);
  });
});
