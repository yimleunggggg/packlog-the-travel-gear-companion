import { afterEach, describe, expect, it, vi } from "vitest";
import { createPacklogRepositoryTarget } from "./packlog-repository";

const emptySeed = {
  trips: [],
  library: [],
};

describe("createPacklogRepositoryTarget", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps anonymous Supabase-configured sessions in browser storage", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");

    const target = createPacklogRepositoryTarget(emptySeed, { userId: null });

    expect(target.key).toBe("browser:guest");
  });

  it("uses a user-scoped Supabase workspace for signed-in sessions", () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");

    const target = createPacklogRepositoryTarget(emptySeed, { userId: "user-a" });

    expect(target.key).toBe("supabase:u:user-a");
  });
});
