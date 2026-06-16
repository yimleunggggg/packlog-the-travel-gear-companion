import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "@/lib/packlog-repository";

const { from, upsert } = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    from,
  }),
}));

const seed = {
  trips: [],
  library: [],
};

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("keeps unauthenticated supabase-backed sessions out of shared remote workspaces", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "default");

    const repo = createPacklogRepository(seed, { userId: null });
    await repo.save(seed);

    expect(from).not.toHaveBeenCalled();
  });

  it("stores authenticated supabase snapshots in the user's workspace", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    from.mockReturnValue({ upsert });
    upsert.mockResolvedValue({ error: null });

    const repo = createPacklogRepository(seed, { userId: "user-123" });
    await repo.save(seed);

    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "u:user-123",
      }),
      { onConflict: "workspace" },
    );
  });
});
