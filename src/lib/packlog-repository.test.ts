import { describe, expect, it } from "vitest";
import { resolvePacklogRepositoryTarget } from "@/lib/packlog-repository";

describe("resolvePacklogRepositoryTarget", () => {
  it("keeps Supabase-configured anonymous sessions in browser storage", () => {
    expect(
      resolvePacklogRepositoryTarget({
        backend: "supabase",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
        userId: null,
      }),
    ).toEqual({ kind: "browser", userId: null });
  });

  it("uses a user-scoped Supabase workspace only for signed-in users", () => {
    expect(
      resolvePacklogRepositoryTarget({
        backend: "supabase",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
        userId: "user-1",
      }),
    ).toEqual({ kind: "supabase", workspace: "u:user-1" });
  });

  it("keeps local backend data scoped by browser user key", () => {
    expect(
      resolvePacklogRepositoryTarget({
        backend: "local",
        userId: "user-1",
      }),
    ).toEqual({ kind: "browser", userId: "user-1" });
  });
});
