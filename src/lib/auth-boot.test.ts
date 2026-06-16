import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

function session(id: string): Session {
  return { user: { id } } as unknown as Session;
}

describe("createAuthBootCoordinator", () => {
  it("does not clear a session that arrived from an auth event when boot times out", () => {
    const applied: Array<Session | null> = [];
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({
      applySession: (nextSession) => applied.push(nextSession),
      markReady,
    });
    const signedIn = session("user-1");

    boot.applyAuthEvent(signedIn);
    boot.timeout();

    expect(applied).toEqual([signedIn]);
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale getSession result after an auth event", () => {
    const applied: Array<Session | null> = [];
    const boot = createAuthBootCoordinator({
      applySession: (nextSession) => applied.push(nextSession),
      markReady: vi.fn(),
    });
    const signedIn = session("user-1");

    boot.applyAuthEvent(signedIn);
    boot.finishGetSession(null);

    expect(applied).toEqual([signedIn]);
  });

  it("keeps listening for later auth events after getSession marks boot ready", () => {
    const applied: Array<Session | null> = [];
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({
      applySession: (nextSession) => applied.push(nextSession),
      markReady,
    });
    const signedIn = session("user-1");

    boot.finishGetSession(null);
    boot.applyAuthEvent(signedIn);

    expect(applied).toEqual([null, signedIn]);
    expect(markReady).toHaveBeenCalledTimes(1);
  });
});
