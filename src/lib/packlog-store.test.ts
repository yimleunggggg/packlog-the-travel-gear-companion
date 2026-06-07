import { describe, expect, it } from "vitest";
import { canSavePacklogSnapshot } from "@/lib/packlog-store";
import type { PacklogRepository } from "@/lib/packlog-repository";

function fakeRepository(): PacklogRepository {
  return {
    load: async () => ({ trips: [], library: [] }),
    save: async () => {},
    clear: async () => {},
  };
}

describe("canSavePacklogSnapshot", () => {
  it("does not let a previous repository load unlock saves for the current repository", () => {
    const previousRepository = fakeRepository();
    const currentRepository = fakeRepository();

    expect(canSavePacklogSnapshot(currentRepository, previousRepository)).toBe(false);
  });

  it("allows saving after the current repository has loaded", () => {
    const currentRepository = fakeRepository();

    expect(canSavePacklogSnapshot(currentRepository, currentRepository)).toBe(true);
  });
});
