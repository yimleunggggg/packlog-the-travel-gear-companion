import { describe, expect, it } from "vitest";
import { suggestFromName } from "@/lib/weight-library";

describe("suggestFromName", () => {
  it("maps 电脑 to laptop weight (not 100g unknown fallback)", () => {
    const h = suggestFromName("电脑");
    expect(h).not.toBeNull();
    expect(h!.category).toBe("tech");
    expect(h!.weightG).toBeGreaterThanOrEqual(1000);
  });

  it("maps English notebook to laptop", () => {
    const h = suggestFromName("notebook");
    expect(h?.category).toBe("tech");
    expect(h!.weightG).toBeGreaterThanOrEqual(1000);
  });

  it("maps 记事本 to paper notebook doc category", () => {
    const h = suggestFromName("记事本");
    expect(h?.category).toBe("doc");
    expect(h!.weightG).toBeLessThan(500);
  });
});
