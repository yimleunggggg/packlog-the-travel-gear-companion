import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GearSpec, Trip } from "@/lib/packlog-data";

const supabaseMock = vi.hoisted(() => {
  const query = {} as {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.maybeSingle = vi.fn();
  query.upsert = vi.fn();
  query.delete = vi.fn(() => query);

  const client = {
    from: vi.fn(() => query),
  };

  return {
    client,
    getSupabaseBrowserClient: vi.fn(() => client),
    query,
  };
});

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: supabaseMock.getSupabaseBrowserClient,
}));

import { createPacklogRepository, createSupabasePacklogRepository } from "@/lib/packlog-repository";

function makeTrip(id: string): Trip {
  return {
    id,
    title: "Test Trip",
    destinations: [],
    days: 1,
    startDate: "2026.06.11",
    climate: "mild",
    scenario: "general",
    scenarios: ["general"],
    phase: "PACK",
    containers: [],
  };
}

function makeStorage() {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: vi.fn(() => data.clear()),
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(data.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
  };
  return storage;
}

const seed: { trips: Trip[]; library: GearSpec[] } = {
  trips: [makeTrip("seed")],
  library: [],
};

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    supabaseMock.query.maybeSingle.mockResolvedValue({ data: null, error: null });
    supabaseMock.query.upsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", async () => {
    const storage = makeStorage();
    vi.stubGlobal("window", { localStorage: storage });

    const repository = createPacklogRepository(seed, { userId: null });
    await repository.save({ trips: [makeTrip("guest-trip")], library: [] });

    expect(supabaseMock.getSupabaseBrowserClient).not.toHaveBeenCalled();
    expect(storage.getItem("packlog.snapshot.v1")).toContain("guest-trip");
    expect(storage.getItem("packlog.snapshot.v1.u.user-a")).toBeNull();
  });

  it("uses a user-scoped Supabase workspace only when a user id is present", async () => {
    const repository = createPacklogRepository(seed, { userId: "user-a" });
    await repository.save({ trips: [makeTrip("user-trip")], library: [] });

    expect(supabaseMock.getSupabaseBrowserClient).toHaveBeenCalledTimes(1);
    expect(supabaseMock.client.from).toHaveBeenCalledWith("packlog_snapshots");
    expect(supabaseMock.query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "u:user-a",
      }),
      { onConflict: "workspace" },
    );
  });
});

describe("createSupabasePacklogRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws load errors instead of returning seed data that could overwrite remote state", async () => {
    const error = new Error("network down");
    supabaseMock.query.maybeSingle.mockResolvedValue({ data: null, error });

    const repository = createSupabasePacklogRepository({ seed, workspace: "u:user-a" });

    await expect(repository.load()).rejects.toThrow("network down");
  });
});
