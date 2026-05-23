import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabasePacklogRepository } from "@/lib/packlog-repository";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    from: supabaseMock.from,
  }),
}));

function queryChain() {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: supabaseMock.maybeSingle,
  };
  return chain;
}

describe("createSupabasePacklogRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockReturnValue(queryChain());
  });

  it("does not treat Supabase read errors as an empty seed snapshot", async () => {
    const error = { message: "network unavailable" };
    supabaseMock.maybeSingle.mockResolvedValue({ data: null, error });

    const repo = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:user-1",
    });

    await expect(repo.load()).rejects.toEqual(error);
  });

  it("rejects invalid remote snapshots instead of silently replacing them with seed data", async () => {
    supabaseMock.maybeSingle.mockResolvedValue({
      data: { snapshot: { version: 1, updatedAt: "not-a-date", trips: [], library: [] } },
      error: null,
    });

    const repo = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:user-1",
    });

    await expect(repo.load()).rejects.toThrow("Invalid packlog snapshot payload");
  });
});
