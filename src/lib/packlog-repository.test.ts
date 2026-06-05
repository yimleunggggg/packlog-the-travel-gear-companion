import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPacklogRepository,
  createSupabasePacklogRepository,
} from "@/lib/packlog-repository";

const supabaseMock = vi.hoisted(() => ({
  client: null as null | { from: ReturnType<typeof vi.fn> },
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => supabaseMock.client,
}));

const seed = {
  trips: [],
  library: [],
};

function stubSupabaseEnv() {
  vi.stubEnv("VITE_DATA_BACKEND", "supabase");
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
}

function createLoadClient(result: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const limit = vi.fn(() => ({ maybeSingle }));
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from, select, eq, order, limit, maybeSingle };
}

describe("createPacklogRepository", () => {
  beforeEach(() => {
    stubSupabaseEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    supabaseMock.client = null;
  });

  it("keeps signed-out sessions in browser storage even when Supabase backend is configured", async () => {
    const from = vi.fn();
    supabaseMock.client = { from };

    const repo = createPacklogRepository(seed, { userId: null });
    await repo.save(seed);

    expect(from).not.toHaveBeenCalled();
  });

  it("surfaces Supabase load errors instead of falling back to seed data", async () => {
    const error = { message: "RLS denied" };
    const client = createLoadClient({ data: null, error });
    supabaseMock.client = { from: client.from };

    const repo = createSupabasePacklogRepository({ seed, workspace: "u:user-1" });

    await expect(repo.load()).rejects.toBe(error);
  });
});
