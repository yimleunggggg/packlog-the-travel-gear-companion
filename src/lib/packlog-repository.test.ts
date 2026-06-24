import { describe, expect, it } from "vitest";
import { resolvePacklogRepositoryTarget } from "@/lib/packlog-repository";

const supabaseEnv = {
  VITE_DATA_BACKEND: "supabase",
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_ANON_KEY: "anon-key",
};

describe("resolvePacklogRepositoryTarget", () => {
  it("keeps anonymous Supabase-configured sessions in browser storage", () => {
    expect(resolvePacklogRepositoryTarget({ userId: null, env: supabaseEnv })).toEqual({
      kind: "browser",
      userId: null,
    });
  });

  it("uses a user-scoped Supabase workspace only after authentication", () => {
    expect(resolvePacklogRepositoryTarget({ userId: "abc-123", env: supabaseEnv })).toEqual({
      kind: "supabase",
      workspace: "u:abc-123",
    });
  });

  it("does not fall back to a shared default workspace when Supabase config is incomplete", () => {
    expect(
      resolvePacklogRepositoryTarget({
        userId: "abc-123",
        env: { VITE_DATA_BACKEND: "supabase", VITE_SUPABASE_URL: "https://example.supabase.co" },
      }),
    ).toEqual({
      kind: "browser",
      userId: "abc-123",
    });
  });
});
