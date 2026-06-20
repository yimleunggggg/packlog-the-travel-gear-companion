import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createAuthBootCoordinator } from "./auth-boot";

function fakeSession(userId: string): Session {
  return { user: { id: userId } } as Session;
}

describe("createAuthBootCoordinator", () => {
  it("unblocks boot timeout without applying a null session", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });

    boot.timeout();

    expect(markReady).toHaveBeenCalledTimes(1);
    expect(applySession).not.toHaveBeenCalled();
  });

  it("keeps an auth event session when a stale getSession result arrives later", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });
    const session = fakeSession("user-1");

    boot.authStateChanged(session);
    boot.getSessionResolved(null);

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith(session);
    expect(markReady).toHaveBeenCalledTimes(2);
  });

  it("does not clear a session when timeout fires after an auth event", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });
    const session = fakeSession("user-2");

    boot.authStateChanged(session);
    boot.timeout();

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith(session);
  });

  it("ignores late signals after dispose", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });

    boot.dispose();
    boot.getSessionResolved(fakeSession("user-3"));
    boot.authStateChanged(null);
    boot.timeout();

    expect(applySession).not.toHaveBeenCalled();
    expect(markReady).not.toHaveBeenCalled();
  });
});
