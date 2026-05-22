import { describe, expect, it } from "vitest";
import { createRepositoryHydrationGate } from "./repository-hydration";

describe("createRepositoryHydrationGate", () => {
  it("blocks saves until the current repository load succeeds", () => {
    const gate = createRepositoryHydrationGate();

    const localLoad = gate.beginLoad();
    expect(gate.canSave()).toBe(false);
    expect(gate.markLoaded(localLoad)).toBe(true);
    expect(gate.canSave()).toBe(true);

    const remoteLoad = gate.beginLoad();
    expect(gate.canSave()).toBe(false);

    expect(gate.markLoaded(localLoad)).toBe(false);
    expect(gate.canSave()).toBe(false);

    expect(gate.markLoaded(remoteLoad)).toBe(true);
    expect(gate.canSave()).toBe(true);
  });
});
