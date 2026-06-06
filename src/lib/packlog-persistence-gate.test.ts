import { describe, expect, it } from "vitest";
import { createRepositoryLoadGate } from "./packlog-persistence-gate";

describe("createRepositoryLoadGate", () => {
  it("blocks saves while a new repository is still loading", () => {
    const gate = createRepositoryLoadGate<object>();
    const guestRepository = {};
    const userRepository = {};

    const guestLoad = gate.beginLoad();
    expect(gate.canSave(guestRepository)).toBe(false);
    expect(gate.finishLoad(guestLoad, guestRepository)).toBe(true);
    expect(gate.canSave(guestRepository)).toBe(true);

    const userLoad = gate.beginLoad();
    expect(gate.canSave(guestRepository)).toBe(false);
    expect(gate.canSave(userRepository)).toBe(false);

    expect(gate.finishLoad(guestLoad, guestRepository)).toBe(false);
    expect(gate.canSave(guestRepository)).toBe(false);
    expect(gate.canSave(userRepository)).toBe(false);

    expect(gate.finishLoad(userLoad, userRepository)).toBe(true);
    expect(gate.canSave(userRepository)).toBe(true);
  });
});
