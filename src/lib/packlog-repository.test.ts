import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository, createSupabasePacklogRepository } from "@/lib/packlog-repository";

const supabaseClientMock = vi.hoisted(() => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: supabaseClientMock.getSupabaseBrowserClient,
}));

const seed = { trips: [], library: [] };

function makeClient(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  };
  const client = {
    from: vi.fn(() => query),
  };
  return { client, query };
}

describe("packlog repository Supabase safety", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    supabaseClientMock.getSupabaseBrowserClient.mockReset();
  });

  it("keeps signed-out users on local storage even when Supabase backend is configured", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const repo = createPacklogRepository(seed, { userId: null });

    await expect(repo.load()).resolves.toEqual(seed);
    expect(supabaseClientMock.getSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("scopes signed-in Supabase repositories to the user workspace", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    const { client, query } = makeClient({ data: null, error: null });
    supabaseClientMock.getSupabaseBrowserClient.mockReturnValue(client);

    const repo = createPacklogRepository(seed, { userId: "user-1" });
    await expect(repo.load()).resolves.toEqual(seed);

    expect(client.from).toHaveBeenCalledWith("packlog_snapshots");
    expect(query.eq).toHaveBeenCalledWith("workspace", "u:user-1");
  });

  it("rejects invalid Supabase snapshots instead of overwriting them with seed data", async () => {
    const { client } = makeClient({ data: { snapshot: { version: 1, trips: "bad" } }, error: null });
    supabaseClientMock.getSupabaseBrowserClient.mockReturnValue(client);
    const repo = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repo.load()).rejects.toThrow("Invalid Supabase packlog snapshot");
  });

  it("rejects Supabase load errors so stale in-memory state is not auto-saved", async () => {
    const { client } = makeClient({ data: null, error: new Error("network down") });
    supabaseClientMock.getSupabaseBrowserClient.mockReturnValue(client);
    const repo = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repo.load()).rejects.toThrow("network down");
  });
});
