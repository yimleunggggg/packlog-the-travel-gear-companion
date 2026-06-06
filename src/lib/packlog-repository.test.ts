import { describe, expect, it } from "vitest";
import { shouldUseSupabaseRepository } from "./packlog-repository";

describe("shouldUseSupabaseRepository", () => {
  it("keeps anonymous sessions on browser storage even when Supabase is configured", () => {
    expect(
      shouldUseSupabaseRepository({
        backend: "supabase",
        userId: null,
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
      }),
    ).toBe(false);
  });

  it("uses Supabase only for authenticated workspaces with complete config", () => {
    expect(
      shouldUseSupabaseRepository({
        backend: "supabase",
        userId: "user-1",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
      }),
    ).toBe(true);
    expect(
      shouldUseSupabaseRepository({
        backend: "local",
        userId: "user-1",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
      }),
    ).toBe(false);
  });
});
