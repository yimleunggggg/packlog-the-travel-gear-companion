import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePacklogRepositoryTarget } from "@/lib/packlog-repository";

describe("resolvePacklogRepositoryTarget", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses browser storage for anonymous users even when Supabase is configured", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");

    expect(resolvePacklogRepositoryTarget({ userId: null })).toEqual({
      kind: "browser",
      key: "browser:guest",
      userId: null,
    });
  });

  it("uses a user-scoped Supabase workspace for signed-in users", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");

    expect(resolvePacklogRepositoryTarget({ userId: "user-1" })).toEqual({
      kind: "supabase",
      key: "supabase:u:user-1",
      userId: "user-1",
      workspace: "u:user-1",
    });
  });
});
