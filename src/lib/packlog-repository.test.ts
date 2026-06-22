import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "./packlog-repository";

const { getClientMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: getClientMock,
}));

const seed = {
  trips: [],
  library: [],
};

function enableSupabaseEnv() {
  vi.stubEnv("VITE_DATA_BACKEND", "supabase");
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
}

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    getClientMock.mockReset();
  });

  it("keeps anonymous users in browser storage even when Supabase is configured", () => {
    enableSupabaseEnv();

    createPacklogRepository(seed, { userId: null });

    expect(getClientMock).not.toHaveBeenCalled();
  });

  it("uses a user-scoped Supabase workspace for signed-in users", async () => {
    enableSupabaseEnv();
    const upsert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ upsert }));
    getClientMock.mockReturnValue({ from });

    const repository = createPacklogRepository(seed, { userId: "user-123" });
    await repository.save(seed);

    expect(getClientMock).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "u:user-123",
        schema_version: 1,
      }),
      { onConflict: "workspace" },
    );
  });
});
