import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
  };
  const client = {
    from: vi.fn(),
  };
  const getSupabaseBrowserClient = vi.fn();
  return { client, getSupabaseBrowserClient, query };
});

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: supabaseMock.getSupabaseBrowserClient,
}));

import {
  createPacklogRepository,
  createSupabasePacklogRepository,
  resolvePacklogRepositoryTarget,
} from "@/lib/packlog-repository";

const seed = { trips: [], library: [] };

function resetSupabaseMock() {
  supabaseMock.query.select.mockReturnValue(supabaseMock.query);
  supabaseMock.query.eq.mockReturnValue(supabaseMock.query);
  supabaseMock.query.order.mockReturnValue(supabaseMock.query);
  supabaseMock.query.limit.mockReturnValue(supabaseMock.query);
  supabaseMock.query.maybeSingle.mockReset();
  supabaseMock.client.from.mockReturnValue(supabaseMock.query);
  supabaseMock.getSupabaseBrowserClient.mockReturnValue(supabaseMock.client);
}

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    resetSupabaseMock();
  });

  it("uses browser storage for anonymous sessions even when Supabase is configured", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");

    expect(resolvePacklogRepositoryTarget({ userId: null })).toEqual({
      kind: "browser",
      userId: null,
    });

    const repo = createPacklogRepository(seed, { userId: null });

    expect(repo.key).toBe("browser:packlog.snapshot.v1");
    expect(supabaseMock.getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("uses a user-scoped Supabase workspace for signed-in sessions", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    expect(resolvePacklogRepositoryTarget({ userId: "user-1" })).toEqual({
      kind: "supabase",
      workspace: "u:user-1",
    });

    const repo = createPacklogRepository(seed, { userId: "user-1" });

    expect(repo.key).toBe("supabase:u:user-1");
    expect(supabaseMock.getSupabaseBrowserClient).toHaveBeenCalledTimes(1);
  });
});

describe("createSupabasePacklogRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMock();
  });

  it("throws load errors instead of returning seed data that could overwrite remote state", async () => {
    supabaseMock.query.maybeSingle.mockResolvedValue({
      data: null,
      error: new Error("RLS denied"),
    });

    const repo = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repo.load()).rejects.toThrow("RLS denied");
  });

  it("throws invalid stored snapshots instead of truncating them to seed data", async () => {
    supabaseMock.query.maybeSingle.mockResolvedValue({
      data: { snapshot: { version: 1, updatedAt: "not-a-date", trips: [], library: [] } },
      error: null,
    });

    const repo = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repo.load()).rejects.toThrow("Invalid Packlog snapshot payload");
  });
});
