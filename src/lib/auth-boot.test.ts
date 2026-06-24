import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createAuthBootCoordinator } from "@/lib/auth-boot";

const sessionA = { user: { id: "user-a" } } as Session;
const sessionB = { user: { id: "user-b" } } as Session;

describe("createAuthBootCoordinator", () => {
  it("does not clear an auth event session when getSession resolves stale null later", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });

    boot.authStateChanged(sessionA);
    boot.finishInitialSession(null);

    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith(sessionA);
    expect(markReady).toHaveBeenCalledTimes(1);
  });

  it("unblocks readiness on timeout without applying an anonymous session", () => {
    const applySession = vi.fn();
    const markReady = vi.fn();
    const boot = createAuthBootCoordinator({ applySession, markReady });

    boot.timeout();
    boot.authStateChanged(sessionB);

    expect(markReady).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledTimes(1);
    expect(applySession).toHaveBeenCalledWith(sessionB);
  });
});
