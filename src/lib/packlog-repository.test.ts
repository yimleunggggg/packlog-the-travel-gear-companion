import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "./packlog-repository";

const { mockGetSupabaseBrowserClient } = vi.hoisted(() => ({
  mockGetSupabaseBrowserClient: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: mockGetSupabaseBrowserClient,
}));

const seed = {
  trips: [],
  library: [],
};

function stubSupabaseEnv() {
  vi.stubEnv("VITE_DATA_BACKEND", "supabase");
  vi.stubEnv("VITE_SUPABASE_URL", "https://packlog.example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
}

function fakeClient(loadResult: unknown = { data: null, error: null }) {
  const table = {
    select: vi.fn(() => table),
    eq: vi.fn(() => table),
    order: vi.fn(() => table),
    limit: vi.fn(() => table),
    maybeSingle: vi.fn(async () => loadResult),
    upsert: vi.fn(async () => ({ error: null })),
    delete: vi.fn(() => table),
  };
  const client = {
    from: vi.fn(() => table),
  };
  return { client, table };
}

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockGetSupabaseBrowserClient.mockReset();
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", async () => {
    stubSupabaseEnv();
    mockGetSupabaseBrowserClient.mockImplementation(() => {
      throw new Error("Supabase should not be used without a user id");
    });

    const repository = createPacklogRepository(seed, { userId: null });

    await expect(repository.load()).resolves.toEqual(seed);
    expect(mockGetSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it("scopes signed-in Supabase snapshots to the auth user workspace", async () => {
    stubSupabaseEnv();
    const { client, table } = fakeClient();
    mockGetSupabaseBrowserClient.mockReturnValue(client);

    const repository = createPacklogRepository(seed, { userId: "user-123" });

    await repository.load();
    await repository.save(seed);

    expect(table.eq).toHaveBeenCalledWith("workspace", "u:user-123");
    expect(table.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: "u:user-123" }),
      { onConflict: "workspace" },
    );
  });

  it("does not turn Supabase load errors into seed state", async () => {
    stubSupabaseEnv();
    const { client } = fakeClient({ data: null, error: new Error("network down") });
    mockGetSupabaseBrowserClient.mockReturnValue(client);

    const repository = createPacklogRepository(seed, { userId: "user-123" });

    await expect(repository.load()).rejects.toThrow("network down");
  });
});
