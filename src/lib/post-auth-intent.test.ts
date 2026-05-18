import { describe, expect, it } from "vitest";
import { parseStoredPostAuthIntent, type PostAuthIntent } from "@/lib/post-auth-intent";

const intent: PostAuthIntent = { v: 1, kind: "openNewTrip" };

describe("parseStoredPostAuthIntent", () => {
  it("accepts a non-expired stored intent envelope", () => {
    expect(
      parseStoredPostAuthIntent(
        JSON.stringify({
          intent,
          expiresAt: 1_500,
        }),
        1_000,
      ),
    ).toEqual(intent);
  });

  it("rejects expired intents", () => {
    expect(
      parseStoredPostAuthIntent(
        JSON.stringify({
          intent,
          expiresAt: 1_000,
        }),
        1_000,
      ),
    ).toBeNull();
  });

  it("rejects legacy unexpiring intent payloads", () => {
    expect(parseStoredPostAuthIntent(JSON.stringify(intent), 1_000)).toBeNull();
  });
});
