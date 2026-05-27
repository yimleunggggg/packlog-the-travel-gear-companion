import { describe, expect, it, vi } from "vitest";
import {
  createSupabasePacklogRepository,
  packlogSnapshotWorkspaceForUser,
  shouldUseSupabaseSnapshots,
} from "@/lib/packlog-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

function mockSupabaseLoad(result: { data: unknown; error: unknown }) {
  vi.mocked(getSupabaseBrowserClient).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: () => Promise.resolve(result),
            }),
          }),
        }),
      }),
    }),
  } as never);
}

describe("packlog repository backend selection", () => {
  it("uses user-scoped Supabase workspaces", () => {
    expect(packlogSnapshotWorkspaceForUser("user-123")).toBe("u:user-123");
  });

  it("keeps guests out of shared Supabase snapshot workspaces", () => {
    expect(
      shouldUseSupabaseSnapshots({
        backend: "supabase",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
        userId: null,
      }),
    ).toBe(false);
  });

  it("only enables Supabase snapshots when config and user are both present", () => {
    expect(
      shouldUseSupabaseSnapshots({
        backend: "supabase",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
        userId: "user-123",
      }),
    ).toBe(true);

    expect(
      shouldUseSupabaseSnapshots({
        backend: "local",
        projectUrl: "https://example.supabase.co",
        anonKey: "anon-key",
        userId: "user-123",
      }),
    ).toBe(false);
  });

  it("does not silently fall back to seed data on Supabase load errors", async () => {
    mockSupabaseLoad({ data: null, error: { message: "RLS denied" } });

    const repo = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:user-123",
    });

    await expect(repo.load()).rejects.toMatchObject({ message: "RLS denied" });
  });

  it("does not overwrite invalid cloud snapshots with seed data", async () => {
    mockSupabaseLoad({ data: { snapshot: { version: -1 } }, error: null });

    const repo = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:user-123",
    });

    await expect(repo.load()).rejects.toThrow("Invalid packlog snapshot payload");
  });
});
