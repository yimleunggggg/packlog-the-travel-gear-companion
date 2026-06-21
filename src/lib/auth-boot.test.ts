import type { Session } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createAuthBootCoordinator } from "./auth-boot";

function fakeSession(id: string): Session {
  return { user: { id } } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("marks auth ready on timeout without applying a null session", () => {
    const applied: Array<Session | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.timeout();

    expect(applied).toEqual([]);
    expect(readyCount).toBe(1);
  });

  it("does not let a stale getSession result overwrite an auth event", () => {
    const session = fakeSession("user-1");
    const applied: Array<Session | null> = [];
    let readyCount = 0;
    const boot = createAuthBootCoordinator({
      applySession: (nextSession) => applied.push(nextSession),
      markReady: () => {
        readyCount += 1;
      },
    });

    boot.receiveAuthEvent(session);
    boot.timeout();
    boot.resolveInitialSession(null);

    expect(applied).toEqual([session]);
    expect(readyCount).toBe(1);
  });

  it("applies the initial session when no auth event arrived first", () => {
    const session = fakeSession("user-2");
    const applied: Array<Session | null> = [];
    const boot = createAuthBootCoordinator({
      applySession: (nextSession) => applied.push(nextSession),
      markReady: () => {},
    });

    boot.resolveInitialSession(session);

    expect(applied).toEqual([session]);
  });
});
