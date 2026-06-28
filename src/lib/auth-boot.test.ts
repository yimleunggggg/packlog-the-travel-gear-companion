import { describe, expect, it, vi } from "vitest";
import { createAuthBootCoordinator } from "./auth-boot";

describe("createAuthBootCoordinator", () => {
  it("does not clear a later auth event when the initial session resolves stale", () => {
    let currentSession: string | null = null;
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({
      applySession: (session) => {
        currentSession = session;
      },
      markReady,
    });

    boot.applyAuthEvent("event-session");
    boot.applyInitialSession(null);

    expect(currentSession).toBe("event-session");
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("marks auth ready on timeout without applying a null session", () => {
    let currentSession = "existing-session";
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator<string>({
      applySession: (session) => {
        currentSession = session ?? "cleared";
      },
      markReady,
    });

    boot.timeout();

    expect(currentSession).toBe("existing-session");
    expect(markReady).toHaveBeenCalledTimes(1);
  });
});
