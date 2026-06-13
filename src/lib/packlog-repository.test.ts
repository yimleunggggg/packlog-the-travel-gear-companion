import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "@/lib/packlog-repository";

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    from: supabaseMocks.from,
  }),
}));

function makeLocalStorage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
  };
}

const emptyState = { trips: [], library: [] };

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    supabaseMocks.from.mockReturnValue({ upsert: supabaseMocks.upsert });
    supabaseMocks.upsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", async () => {
    const localStorage = makeLocalStorage();
    vi.stubGlobal("window", { localStorage });

    const repo = createPacklogRepository(emptyState, { userId: null });
    await repo.save(emptyState);

    expect(supabaseMocks.from).not.toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "packlog.snapshot.v1",
      expect.stringContaining('"version":1'),
    );
  });

  it("scopes signed-in Supabase snapshots to the authenticated user workspace", async () => {
    const repo = createPacklogRepository(emptyState, { userId: "user-123" });
    await repo.save(emptyState);

    expect(supabaseMocks.from).toHaveBeenCalledWith("packlog_snapshots");
    expect(supabaseMocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "u:user-123",
        schema_version: 1,
      }),
      { onConflict: "workspace" },
    );
  });
});
