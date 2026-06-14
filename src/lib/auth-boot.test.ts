import { describe, expect, it } from "vitest";
import { resolveAuthBootUpdate } from "./auth-boot";

describe("resolveAuthBootUpdate", () => {
  it("does not apply a null session on timeout or getSession failure", () => {
    expect(resolveAuthBootUpdate("timeout", 0, 1)).toEqual({
      applySession: false,
      markReady: true,
    });
    expect(resolveAuthBootUpdate("get-session-error", 0, 1)).toEqual({
      applySession: false,
      markReady: true,
    });
  });

  it("does not let a slow getSession response override a later auth event", () => {
    expect(resolveAuthBootUpdate("get-session-success", 0, 1)).toEqual({
      applySession: false,
      markReady: true,
    });
  });

  it("applies auth events and getSession responses when no auth event raced ahead", () => {
    expect(resolveAuthBootUpdate("auth-event", 0, 1)).toEqual({
      applySession: true,
      markReady: true,
    });
    expect(resolveAuthBootUpdate("get-session-success", 0, 0)).toEqual({
      applySession: true,
      markReady: true,
    });
  });
});
