import { afterEach, describe, expect, it, vi } from "vitest";
import type { GearSpec, Trip } from "@/lib/packlog-data";
import { createPacklogRepository } from "@/lib/packlog-repository";

function installLocalStorage() {
  const entries = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
  };
  vi.stubGlobal("window", { localStorage });
  return entries;
}

function testTrip(): Trip {
  return {
    id: "t-guest",
    title: "Guest trip",
    destinations: [],
    days: 1,
    startDate: "2026.06.12",
    climate: "warm",
    scenario: "city",
    scenarios: ["city"],
    phase: "PACK",
    containers: [],
  };
}

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps unauthenticated Supabase deployments on the guest browser snapshot", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://packlog.example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-remote-workspace");
    const entries = installLocalStorage();
    const seed: { trips: Trip[]; library: GearSpec[] } = { trips: [], library: [] };

    const repo = createPacklogRepository(seed, { userId: null });
    await repo.save({ trips: [testTrip()], library: [] });

    expect([...entries.keys()]).toEqual(["packlog.snapshot.v1"]);
    const restored = await repo.load();
    expect(restored.trips.map((trip) => trip.id)).toEqual(["t-guest"]);
  });
});
