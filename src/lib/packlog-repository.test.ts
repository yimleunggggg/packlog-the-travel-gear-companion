import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "@/lib/packlog-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
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

  it("keeps anonymous users on browser storage even when Supabase backend is configured", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const repository = createPacklogRepository(seed, { userId: null });

    expect(repository.key).toBe("browser:packlog.snapshot.v1");
    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
    await repository.save(seed);
    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("stores signed-in Supabase snapshots under the authenticated user workspace", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from } as never);

    const repository = createPacklogRepository(seed, { userId: "user-1" });
    await repository.save(seed);

    expect(repository.key).toBe("supabase:u:user-1");
    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace: "u:user-1" }), {
      onConflict: "workspace",
    });
  });
});
