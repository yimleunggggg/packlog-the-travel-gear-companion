import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "./packlog-repository";
import { getSupabaseBrowserClient } from "./supabase-client";

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const seed = { trips: [], library: [] };

function enableSupabaseBackend() {
  vi.stubEnv("VITE_DATA_BACKEND", "supabase");
  vi.stubEnv("VITE_SUPABASE_URL", "https://packlog.test.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("VITE_PACKLOG_WORKSPACE", "shared-workspace");
}

function installLocalStorage() {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  });
  return storage;
}

describe("createPacklogRepository", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.mocked(getSupabaseBrowserClient).mockReset();
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", async () => {
    enableSupabaseBackend();
    const storage = installLocalStorage();

    const repo = createPacklogRepository(seed, { userId: null });
    await repo.save(seed);

    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
    expect(storage.has("packlog.snapshot.v1")).toBe(true);
  });

  it("uses an authenticated Supabase workspace scoped to the user id", async () => {
    enableSupabaseBackend();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from } as never);

    const repo = createPacklogRepository(seed, { userId: "user-123" });
    await repo.save(seed);

    expect(from).toHaveBeenCalledWith("packlog_snapshots");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ workspace: "u:user-123" }), {
      onConflict: "workspace",
    });
  });

  it("throws Supabase read errors instead of falling back to seed data", async () => {
    enableSupabaseBackend();
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error("read failed") });
    const limit = vi.fn(() => ({ maybeSingle }));
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from } as never);

    const repo = createPacklogRepository(seed, { userId: "user-123" });

    await expect(repo.load()).rejects.toThrow("read failed");
  });
});
