import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: maybeSingleMock,
            }),
          }),
        }),
      }),
    }),
  }),
}));

import {
  createSupabasePacklogRepository,
  packlogRepositoryTargetKey,
  resolvePacklogRepositoryTarget,
} from "@/lib/packlog-repository";

describe("resolvePacklogRepositoryTarget", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps anonymous sessions out of Supabase snapshot storage", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-default");

    expect(resolvePacklogRepositoryTarget({ userId: null })).toEqual({
      type: "browser",
      userId: null,
    });
  });

  it("uses a user-scoped Supabase workspace for signed-in users", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-default");

    const target = resolvePacklogRepositoryTarget({ userId: "user-123" });

    expect(target).toEqual({
      type: "supabase",
      workspace: "u:user-123",
      userId: "user-123",
    });
    expect(packlogRepositoryTargetKey(target)).toBe("supabase:u:user-123");
  });

  it("falls back to user-scoped browser storage when Supabase config is incomplete", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const target = resolvePacklogRepositoryTarget({ userId: "user-123" });

    expect(target).toEqual({
      type: "browser",
      userId: "user-123",
    });
    expect(packlogRepositoryTargetKey(target)).toBe("browser:user-123");
  });

  it("rejects Supabase load errors instead of treating them as an empty snapshot", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: new Error("rls denied"),
    });

    const repo = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:user-123",
    });

    await expect(repo.load()).rejects.toThrow("rls denied");
  });
});
