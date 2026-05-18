import { describe, expect, it } from "vitest";
import { shouldConsumeStoredPostAuthIntent } from "@/lib/auth-resume";

describe("shouldConsumeStoredPostAuthIntent", () => {
  it("does not treat delayed existing-session hydration as a fresh sign-in", () => {
    expect(
      shouldConsumeStoredPostAuthIntent({
        previousUserId: null,
        currentUserId: "user-1",
        sawExplicitSignIn: false,
      }),
    ).toBe(false);
  });

  it("allows stored intent resume after an explicit sign-in transition", () => {
    expect(
      shouldConsumeStoredPostAuthIntent({
        previousUserId: null,
        currentUserId: "user-1",
        sawExplicitSignIn: true,
      }),
    ).toBe(true);
  });

  it("does not resume again while a user is already present", () => {
    expect(
      shouldConsumeStoredPostAuthIntent({
        previousUserId: "user-1",
        currentUserId: "user-1",
        sawExplicitSignIn: true,
      }),
    ).toBe(false);
  });
});
