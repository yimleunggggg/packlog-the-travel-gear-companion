import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "@/lib/packlog-repository";

const mocks = vi.hoisted(() => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: mocks.getSupabaseBrowserClient,
}));

const seed = { trips: [], library: [] };

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", async () => {
    const repository = createPacklogRepository(seed, { userId: null });

    await repository.save(seed);

    expect(mocks.getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("writes signed-in sessions to the user's Supabase workspace", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    mocks.getSupabaseBrowserClient.mockReturnValue({ from });

    const repository = createPacklogRepository(seed, { userId: "user-1" });
    await repository.save(seed);

    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace: "u:user-1" }), {
      onConflict: "workspace",
    });
  });
});
