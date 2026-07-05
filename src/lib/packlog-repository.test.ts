import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabasePacklogRepository,
  resolvePacklogRepositoryTarget,
} from "@/lib/packlog-repository";

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: supabaseMocks.getSupabaseBrowserClient,
}));

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: supabaseMocks.getSupabaseBrowserClient,
}));

function mockSupabaseLoad(result: { data: unknown; error: Error | null }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const limit = vi.fn(() => ({ maybeSingle }));
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from };
}

describe("resolvePacklogRepositoryTarget", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-prod");

    expect(resolvePacklogRepositoryTarget({ userId: null })).toEqual({
      kind: "browser",
      userId: null,
    });
  });

  it("uses a user-scoped Supabase workspace for signed-in users", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");

    expect(resolvePacklogRepositoryTarget({ userId: "user-1" })).toEqual({
      kind: "supabase",
      workspace: "u:user-1",
    });
  });
});

describe("createSupabasePacklogRepository", () => {
  const seed = { trips: [], library: [] };

  beforeEach(() => {
    supabaseMocks.getSupabaseBrowserClient.mockReset();
  });

  it("throws load errors instead of returning seed for autosave to overwrite", async () => {
    supabaseMocks.getSupabaseBrowserClient.mockReturnValue(
      mockSupabaseLoad({ data: null, error: new Error("relation missing") }),
    );

    const repository = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repository.load()).rejects.toThrow("relation missing");
  });

  it("throws invalid snapshot payloads instead of returning seed", async () => {
    supabaseMocks.getSupabaseBrowserClient.mockReturnValue(
      mockSupabaseLoad({ data: { snapshot: { version: 0 } }, error: null }),
    );

    const repository = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repository.load()).rejects.toThrow("Invalid Packlog snapshot payload");
  });

  it("returns seed only when no snapshot row exists", async () => {
    supabaseMocks.getSupabaseBrowserClient.mockReturnValue(
      mockSupabaseLoad({ data: null, error: null }),
    );

    const repository = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repository.load()).resolves.toBe(seed);
  });
});
