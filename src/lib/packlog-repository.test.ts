import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPacklogRepository,
  createSupabasePacklogRepository,
  type PacklogRepository,
} from "@/lib/packlog-repository";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({ from: mocks.from }),
}));

const seed = { trips: [], library: [] };

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.from.mockReset();
});

describe("createPacklogRepository", () => {
  it("keeps unauthenticated users on local storage even when Supabase is configured", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    mocks.from.mockImplementation(() => {
      throw new Error("Supabase should not be used for guests");
    });

    const repo = createPacklogRepository(seed, { userId: null });

    await expect(repo.load()).resolves.toEqual(seed);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("uses the authenticated user id as the Supabase workspace", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ upsert });

    const repo = createPacklogRepository(seed, { userId: "user-123" });
    await repo.save(seed);

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace: "u:user-123" }), {
      onConflict: "workspace",
    });
  });
});

describe("createSupabasePacklogRepository", () => {
  it("throws load errors instead of treating them as an empty snapshot", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("network down") }),
    };
    mocks.from.mockReturnValue(query);

    const repo: PacklogRepository = createSupabasePacklogRepository({
      seed,
      workspace: "u:user-123",
    });

    await expect(repo.load()).rejects.toThrow("network down");
  });
});
