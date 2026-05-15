import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/packlog-data";
import { removeTripItem, setTripItemVerdict, updateTripItem } from "@/lib/packlog-commands";
import { filterSeedsNotInTrip, mergedScenarioSeedsForTrip } from "@/lib/packing-pool";

function diveTripWithItem(): Trip {
  return {
    id: "t1",
    title: "Dive test",
    destinations: [],
    days: 3,
    startDate: "2026.06.01",
    climate: "warm",
    scenario: "dive",
    scenarios: ["dive"],
    phase: "PACK",
    containers: [
      {
        id: "c1",
        code: "C-01",
        name: "Personal",
        type: "personal",
        capacityL: 20,
        maxKg: 8,
        items: [
          {
            id: "i-cert",
            gearId: null,
            name: "Passport + Cert Card",
            nameEn: "Passport + Cert Card",
            nameZh: "护照 + 潜水证",
            qty: 1,
            weightG: 75,
            category: "doc",
            status: "todo",
            verdict: null,
            utility: null,
            ownership: "owned",
          },
        ],
      },
    ],
  };
}

describe("removeTripItem", () => {
  it("records dismissed scenario seed when last matching item is removed", () => {
    const trip = diveTripWithItem();
    const merged = mergedScenarioSeedsForTrip(trip);
    expect(filterSeedsNotInTrip(trip, merged).some((s) => s.en === "Passport + Cert Card")).toBe(
      false,
    );

    const next = removeTripItem(trip, "c1", "i-cert");
    expect(next.containers[0]!.items).toHaveLength(0);
    expect(next.dismissedScenarioSeeds).toContain("passport + cert card");

    const mergedAfter = mergedScenarioSeedsForTrip(next);
    expect(
      filterSeedsNotInTrip(next, mergedAfter).some((s) => s.en === "Passport + Cert Card"),
    ).toBe(false);
  });

  it("does not dismiss when another item still matches the seed English key", () => {
    const trip = diveTripWithItem();
    const trip2: Trip = {
      ...trip,
      containers: trip.containers.map((c) =>
        c.id !== "c1"
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                {
                  id: "i-dup",
                  gearId: null,
                  name: "Passport + Cert Card",
                  nameEn: "Passport + Cert Card",
                  nameZh: "副本",
                  qty: 1,
                  weightG: 75,
                  category: "doc",
                  status: "todo",
                  verdict: null,
                  utility: null,
                  ownership: "owned",
                },
              ],
            },
      ),
    };

    const next = removeTripItem(trip2, "c1", "i-cert");
    expect(next.containers[0]!.items).toHaveLength(1);
    expect(next.dismissedScenarioSeeds).toBeUndefined();
  });
});

describe("reviewConfirmed", () => {
  it("clears when verdict changes", () => {
    const trip = diveTripWithItem();
    const withConfirm = updateTripItem(trip, "c1", "i-cert", { reviewConfirmed: true });
    expect(withConfirm.containers[0]!.items[0]!.reviewConfirmed).toBe(true);

    const afterVerdict = setTripItemVerdict(withConfirm, "c1", "i-cert", "keep");
    expect(afterVerdict.containers[0]!.items[0]!.reviewConfirmed).toBe(false);
    expect(afterVerdict.containers[0]!.items[0]!.verdict).toBe("keep");
  });

  it("allows only reviewConfirmed patch without clearing", () => {
    const trip = diveTripWithItem();
    const next = updateTripItem(trip, "c1", "i-cert", { reviewConfirmed: true });
    expect(next.containers[0]!.items[0]!.reviewConfirmed).toBe(true);
  });

  it("clears when note patch is applied", () => {
    const trip = diveTripWithItem();
    const confirmed = updateTripItem(trip, "c1", "i-cert", { reviewConfirmed: true });
    const afterNote = updateTripItem(confirmed, "c1", "i-cert", { note: "wet rocks" });
    expect(afterNote.containers[0]!.items[0]!.note).toBe("wet rocks");
    expect(afterNote.containers[0]!.items[0]!.reviewConfirmed).toBe(false);
  });
});
