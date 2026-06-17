import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

function sessionFor(userId: string): Session {
  return {
    user: { id: userId },
  } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("does not clear session state when the boot timeout fires", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });

    boot.handleTimeout();

    expect(markReady).toHaveBeenCalledTimes(1);
    expect(applySession).not.toHaveBeenCalled();
  });

  it("keeps an auth event session when a stale initial session resolves later", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });
    const signedIn = sessionFor("user-1");

    boot.handleAuthEvent(signedIn);
    boot.handleInitialSession(null);

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith(signedIn);
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("ignores an initial-session failure after an auth event", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });
    const signedIn = sessionFor("user-2");

    boot.handleAuthEvent(signedIn);
    boot.handleInitialError();

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith(signedIn);
    expect(markReady).toHaveBeenCalledTimes(1);
  });
});
