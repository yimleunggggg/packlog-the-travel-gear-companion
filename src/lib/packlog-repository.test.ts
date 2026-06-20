import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "./packlog-repository";

const getSupabaseBrowserClient = vi.hoisted(() => vi.fn());

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient,
}));

const seed = { trips: [], library: [] };

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("falls back to browser storage for anonymous users even when Supabase is configured", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");

    const repo = createPacklogRepository(seed, { userId: null });

    await expect(repo.load()).resolves.toEqual(seed);
    await expect(repo.save(seed)).resolves.toBeUndefined();
    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("uses a user-scoped Supabase workspace for signed-in users", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    getSupabaseBrowserClient.mockReturnValue({ from });

    const repo = createPacklogRepository(seed, { userId: "user-123" });
    await repo.save(seed);

    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: "u:user-123" }), { onConflict: "workspace" },
    );
  });
});
