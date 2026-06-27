import { afterEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("./supabase-client", () => supabaseMocks);

import { createPacklogRepository, createSupabasePacklogRepository } from "./packlog-repository";

const emptySeed = { trips: [], library: [] };

function stubSupabaseEnv() {
  vi.stubEnv("VITE_DATA_BACKEND", "supabase");
  vi.stubEnv("VITE_SUPABASE_URL", "https://packlog.test");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");
}

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    supabaseMocks.getSupabaseBrowserClient.mockReset();
  });

  it("does not use Supabase snapshot storage without a signed-in user", async () => {
    stubSupabaseEnv();

    const repo = createPacklogRepository(emptySeed, { userId: null });
    await repo.save(emptySeed);

    expect(supabaseMocks.getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("uses the authenticated user's workspace and ignores configured shared workspaces", async () => {
    stubSupabaseEnv();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    supabaseMocks.getSupabaseBrowserClient.mockReturnValue({ from });

    const repo = createPacklogRepository(emptySeed, { userId: "user-1" });
    await repo.save(emptySeed);

    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: "u:user-1" }),
      { onConflict: "workspace" },
    );
  });
});

describe("createSupabasePacklogRepository", () => {
  afterEach(() => {
    supabaseMocks.getSupabaseBrowserClient.mockReset();
  });

  it("throws load errors instead of treating them as an empty snapshot", async () => {
    const query = {} as {
      select: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
    };
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.order = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("RLS denied"),
    });
    supabaseMocks.getSupabaseBrowserClient.mockReturnValue({ from: vi.fn(() => query) });

    const repo = createSupabasePacklogRepository({
      seed: emptySeed,
      workspace: "u:user-1",
    });

    await expect(repo.load()).rejects.toThrow("RLS denied");
  });
});
