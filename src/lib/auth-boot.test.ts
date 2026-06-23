import { describe, expect, it, vi } from "vitest";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

describe("createAuthBootCoordinator", () => {
  it("does not clear a session when the boot timeout fires", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({ applySession, markReady });

    boot.handleAuthEvent("session-from-event");
    boot.handleTimeout();

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith("session-from-event");
    expect(markReady).toHaveBeenCalledTimes(2);
  });

  it("ignores a stale initial session after an auth event", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({ applySession, markReady });

    boot.handleAuthEvent("session-from-event");
    boot.handleInitialSession(null);

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith("session-from-event");
    expect(markReady).toHaveBeenCalledTimes(2);
  });

  it("applies the initial session when no auth event has arrived", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({ applySession, markReady });

    boot.handleInitialSession("session-from-get-session");

    expect(applySession).toHaveBeenCalledWith("session-from-get-session");
    expect(markReady).toHaveBeenCalledOnce();
  });
});
