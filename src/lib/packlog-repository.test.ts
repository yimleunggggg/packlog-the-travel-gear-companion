import { describe, expect, it, vi } from "vitest";
import { createSupabasePacklogRepository } from "./packlog-repository";
import { gearLibrary, seedTrips } from "./packlog-data";
import { getSupabaseBrowserClient } from "./supabase-client";

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

function mockSupabaseLoad(result: { data: unknown; error: Error | null }) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  vi.mocked(getSupabaseBrowserClient).mockReturnValue({
    from: vi.fn().mockReturnValue(chain),
  } as never);
}

describe("createSupabasePacklogRepository", () => {
  it("does not convert Supabase load errors into an empty seed snapshot", async () => {
    mockSupabaseLoad({ data: null, error: new Error("network unavailable") });

    const repository = createSupabasePacklogRepository({
      seed: { trips: seedTrips, library: gearLibrary },
      workspace: "u:user-1",
    });

    await expect(repository.load()).rejects.toThrow("network unavailable");
  });

  it("does not treat invalid remote snapshots as fresh state", async () => {
    mockSupabaseLoad({ data: { snapshot: { version: "bad" } }, error: null });

    const repository = createSupabasePacklogRepository({
      seed: { trips: seedTrips, library: gearLibrary },
      workspace: "u:user-1",
    });

    await expect(repository.load()).rejects.toThrow("Invalid packlog snapshot payload");
  });
});
