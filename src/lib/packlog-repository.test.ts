import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseBrowserClient } from "./supabase-client";
import {
  createSupabasePacklogRepository,
  resolvePacklogRepositoryTarget,
} from "./packlog-repository";

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

function env(vars: Record<string, string | undefined>) {
  return (name: string) => vars[name];
}

describe("resolvePacklogRepositoryTarget", () => {
  it("keeps anonymous Supabase-configured sessions in browser storage", () => {
    expect(
      resolvePacklogRepositoryTarget({
        userId: null,
        env: env({
          VITE_DATA_BACKEND: "supabase",
          VITE_SUPABASE_URL: "https://example.supabase.co",
          VITE_SUPABASE_ANON_KEY: "anon",
          VITE_PACKLOG_WORKSPACE: "shared",
        }),
      }),
    ).toEqual({ backend: "browser", userId: null });
  });

  it("uses a user-scoped Supabase workspace for signed-in users", () => {
    expect(
      resolvePacklogRepositoryTarget({
        userId: "user-123",
        env: env({
          VITE_DATA_BACKEND: "supabase",
          VITE_SUPABASE_URL: "https://example.supabase.co",
          VITE_SUPABASE_ANON_KEY: "anon",
          VITE_PACKLOG_WORKSPACE: "shared",
        }),
      }),
    ).toEqual({ backend: "supabase", workspace: "u:user-123", userId: "user-123" });
  });
});

describe("createSupabasePacklogRepository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws load errors instead of replacing cloud state with seeds", async () => {
    const error = new Error("RLS denied");
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);

    vi.mocked(getSupabaseBrowserClient).mockReturnValue({
      from: vi.fn(() => query),
    } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

    const repo = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:user-123",
    });

    await expect(repo.load()).rejects.toThrow("RLS denied");
  });
});
