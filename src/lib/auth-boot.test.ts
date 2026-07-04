import { describe, expect, it, vi } from "vitest";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

describe("createAuthBootCoordinator", () => {
  it("keeps an auth-state session when stale getSession resolves later", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({ applySession, markReady });

    boot.authStateChanged("signed-in");
    boot.initialSessionResolved(null);

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith("signed-in");
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("timeout marks auth ready without applying a null session", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({ applySession, markReady });

    boot.timedOut();

    expect(applySession).not.toHaveBeenCalled();
    expect(markReady).toHaveBeenCalledTimes(1);
  });
});
