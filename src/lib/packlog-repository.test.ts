import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepository } from "@/lib/packlog-repository";

function makeStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("createPacklogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps anonymous Supabase-mode snapshots in browser storage", async () => {
    const localStorage = makeStorage();
    vi.stubGlobal("window", { localStorage });
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const repo = createPacklogRepository({ trips: [], library: [] }, { userId: null });

    await repo.save({ trips: [], library: [] });

    expect(localStorage.getItem("packlog.snapshot.v1")).toContain('"version":1');
  });
});
