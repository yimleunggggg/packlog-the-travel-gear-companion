import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabasePacklogRepository } from "@/lib/packlog-repository";
import { getSupabaseBrowserClient } from "./supabase-client";

vi.mock("./supabase-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const mockedGetSupabaseBrowserClient = vi.mocked(getSupabaseBrowserClient);

describe("createSupabasePacklogRepository", () => {
  beforeEach(() => {
    mockedGetSupabaseBrowserClient.mockReset();
  });

  it("throws load errors instead of treating them as an empty snapshot", async () => {
    const selectError = new Error("select failed");
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: selectError }),
    };
    mockedGetSupabaseBrowserClient.mockReturnValue({
      from: vi.fn().mockReturnValue(query),
    } as never);

    const repository = createSupabasePacklogRepository({
      seed: { trips: [], library: [] },
      workspace: "u:test-user",
    });

    await expect(repository.load()).rejects.toThrow("select failed");
  });
});
