import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createAuthBootCoordinator } from "./auth-boot";

function fakeSession(userId: string): Session {
  return { user: { id: userId } } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("does not clear an auth-state session when getSession later returns null", () => {
    const applied: Array<Session | null> = [];
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session),
      markReady,
    });
    const session = fakeSession("user-1");

    boot.fromAuthStateChange(session);
    boot.fromGetSession(null);

    expect(applied).toEqual([session]);
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("marks ready on timeout without applying a signed-out session", () => {
    const applied: Array<Session | null> = [];
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session),
      markReady,
    });

    boot.timeout();

    expect(applied).toEqual([]);
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("accepts a delayed getSession result after timeout when no auth event arrived", () => {
    const applied: Array<Session | null> = [];
    const boot = createAuthBootCoordinator({
      applySession: (session) => applied.push(session),
      markReady: vi.fn(),
    });
    const session = fakeSession("user-2");

    boot.timeout();
    boot.fromGetSession(session);

    expect(applied).toEqual([session]);
  });
});
