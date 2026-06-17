import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "@/lib/packlog-repository";

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: supabaseMocks.getSupabaseBrowserClient,
}));

const seed = {
  trips: [],
  library: [],
};

function stubSupabaseBackendEnv() {
  vi.stubEnv("VITE_DATA_BACKEND", "supabase");
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");
}

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("keeps anonymous Supabase-configured sessions in local browser storage", async () => {
    stubSupabaseBackendEnv();

    const repo = createPacklogRepository(seed, { userId: null });
    await repo.save(seed);

    expect(supabaseMocks.getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("uses the authenticated user id as the Supabase workspace", async () => {
    stubSupabaseBackendEnv();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    supabaseMocks.getSupabaseBrowserClient.mockReturnValue({ from });

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
