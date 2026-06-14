import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "./packlog-repository";
import { getSupabaseBrowserClient } from "./supabase-client";

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const seed = { trips: [], library: [] };

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("keeps anonymous users on browser storage even when Supabase backend is configured", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const repo = createPacklogRepository(seed, { userId: null });

    await expect(repo.load()).resolves.toEqual(seed);
    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("uses the signed-in user's workspace for Supabase snapshots", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({
      from: vi.fn(() => ({ upsert })),
    } as never);

    const repo = createPacklogRepository(seed, { userId: "user-123" });
    await repo.save(seed);

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace: "u:user-123" }), {
      onConflict: "workspace",
    });
  });
});
