import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "./packlog-repository";
import { getSupabaseBrowserClient } from "./supabase-client";

const supabaseClient = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(() => supabaseClient),
}));

const seed = {
  trips: [],
  library: [],
};

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  });

  it("keeps anonymous Supabase-mode sessions in browser storage instead of a shared workspace", () => {
    createPacklogRepository(seed, { userId: null });

    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("uses a user-scoped Supabase workspace for signed-in sessions", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    supabaseClient.from.mockReturnValue({ upsert });

    const repo = createPacklogRepository(seed, { userId: "user-1" });
    await repo.save(seed);

    expect(getSupabaseBrowserClient).toHaveBeenCalledOnce();
    expect(supabaseClient.from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "u:user-1",
      }),
      { onConflict: "workspace" },
    );
  });
});
