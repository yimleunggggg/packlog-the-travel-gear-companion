import { afterEach, describe, expect, it, vi } from "vitest";
import { gearLibrary, seedTrips } from "@/lib/packlog-data";
import {
  createBrowserPacklogRepository,
  createPacklogRepository,
  hasBrowserPacklogSnapshot,
} from "@/lib/packlog-repository";

type LocalStorageStub = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

function installLocalStorage() {
  const values = new Map<string, string>();
  const localStorage: LocalStorageStub = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });

  return values;
}

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
});

describe("packlog repository", () => {
  it("preserves an invalid browser snapshot instead of deleting it", async () => {
    const storage = installLocalStorage();
    storage.set("packlog.snapshot.v1", "{not json");

    const repo = createBrowserPacklogRepository({ trips: seedTrips, library: gearLibrary });

    await expect(repo.load()).rejects.toThrow(/Invalid PACKLOG snapshot/);
    expect(storage.get("packlog.snapshot.v1")).toBe("{not json");
    expect(hasBrowserPacklogSnapshot(null)).toBe(true);
  });

  it("uses local browser storage for signed-out users even when Supabase backend is configured", async () => {
    const storage = installLocalStorage();
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const repo = createPacklogRepository(
      { trips: seedTrips, library: gearLibrary },
      { userId: null },
    );
    await repo.save({ trips: [], library: [] });

    expect(storage.has("packlog.snapshot.v1")).toBe(true);
    expect(storage.has("packlog.snapshot.v1.u.null")).toBe(false);
  });
});
