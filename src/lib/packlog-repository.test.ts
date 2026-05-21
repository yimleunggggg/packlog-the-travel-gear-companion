import { describe, expect, it } from "vitest";
import { packlogSnapshotWorkspaceForUser } from "@/lib/packlog-repository";

describe("packlogSnapshotWorkspaceForUser", () => {
  it("uses the authenticated user id as the only Supabase snapshot workspace", () => {
    expect(packlogSnapshotWorkspaceForUser("user-123")).toBe("u:user-123");
  });

  it("does not create a shared Supabase workspace for guests", () => {
    expect(packlogSnapshotWorkspaceForUser(null)).toBeNull();
    expect(packlogSnapshotWorkspaceForUser(undefined)).toBeNull();
  });
});
