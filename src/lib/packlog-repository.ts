import type { z } from "zod";
import type { GearSpec, Trip } from "./packlog-data";
import { getSupabaseBrowserClient } from "./supabase-client";
import {
  packlogSnapshotSchema,
  packlogSnapshotVersion,
  tripSchema,
  type PacklogSnapshot,
} from "./packlog-schema";

const STORAGE_KEY_GUEST = "packlog.snapshot.v1";

function browserStorageKey(userId: string | null | undefined): string {
  if (userId) return `packlog.snapshot.v1.u.${userId}`;
  return STORAGE_KEY_GUEST;
}

type SeedState = {
  trips: Trip[];
  library: GearSpec[];
};

export interface PacklogRepository {
  load: () => Promise<SeedState>;
  save: (state: SeedState) => Promise<void>;
  clear: () => Promise<void>;
}

function normalizeTripForSnapshot(t: Trip): z.infer<typeof tripSchema> {
  const scenarios = t.scenarios?.length ? t.scenarios : [t.scenario];
  return { ...t, scenario: scenarios[0]!, scenarios };
}

function toSnapshot(state: SeedState): PacklogSnapshot {
  return {
    version: packlogSnapshotVersion,
    updatedAt: new Date().toISOString(),
    trips: state.trips.map(normalizeTripForSnapshot),
    library: state.library,
  };
}

function parseSnapshot(raw: string): PacklogSnapshot | null {
  try {
    const parsed = JSON.parse(raw);
    const validated = packlogSnapshotSchema.safeParse(parsed);
    if (!validated.success) return null;
    return validated.data;
  } catch {
    return null;
  }
}

function parseSnapshotPayload(payload: unknown): PacklogSnapshot | null {
  const validated = packlogSnapshotSchema.safeParse(payload);
  if (!validated.success) return null;
  return validated.data;
}

export function createBrowserPacklogRepository(
  seed: SeedState,
  opts?: { userId?: string | null },
): PacklogRepository {
  const canUseStorage = () =>
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  const key = browserStorageKey(opts?.userId ?? null);

  return {
    load: async () => {
      if (!canUseStorage()) return seed;
      const raw = window.localStorage.getItem(key);
      if (!raw) return seed;

      const snapshot = parseSnapshot(raw);
      if (!snapshot) {
        window.localStorage.removeItem(key);
        return seed;
      }

      return {
        trips: snapshot.trips,
        library: snapshot.library,
      };
    },
    save: async (state) => {
      if (!canUseStorage()) return;
      const snapshot = toSnapshot(state);
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    },
    clear: async () => {
      if (!canUseStorage()) return;
      window.localStorage.removeItem(key);
    },
  };
}

type SupabaseRepositoryOptions = {
  seed: SeedState;
  workspace: string;
};

export function createSupabasePacklogRepository(
  options: SupabaseRepositoryOptions,
): PacklogRepository {
  const { seed, workspace } = options;
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase client unavailable");
  const table = "packlog_snapshots";

  return {
    load: async () => {
      const { data, error } = await client
        .from(table)
        .select("snapshot")
        .eq("workspace", workspace)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.snapshot) return seed;
      const snapshot = parseSnapshotPayload(data.snapshot);
      if (!snapshot) throw new Error("Invalid packlog snapshot payload");
      return {
        trips: snapshot.trips,
        library: snapshot.library,
      };
    },
    save: async (state) => {
      const snapshot = toSnapshot(state);
      const { error } = await client.from(table).upsert(
        {
          workspace,
          snapshot,
          schema_version: packlogSnapshotVersion,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace",
        },
      );
      if (error) throw error;
    },
    clear: async () => {
      const { error } = await client.from(table).delete().eq("workspace", workspace);
      if (error) throw error;
    },
  };
}

function getEnv(name: string): string | undefined {
  if (typeof import.meta === "undefined") return undefined;
  const env = import.meta.env as Record<string, string | undefined>;
  return env[name];
}

export function createPacklogRepository(
  seed: SeedState,
  opts?: { userId?: string | null },
): PacklogRepository {
  const backend = getEnv("VITE_DATA_BACKEND") ?? "local";
  const projectUrl = getEnv("VITE_SUPABASE_URL");
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
  const uid = opts?.userId ?? null;
  const workspace =
    backend === "supabase" && uid ? `u:${uid}` : (getEnv("VITE_PACKLOG_WORKSPACE") ?? "default");

  if (backend === "supabase" && projectUrl && anonKey) {
    return createSupabasePacklogRepository({
      seed,
      workspace,
    });
  }
  return createBrowserPacklogRepository(seed, { userId: uid });
}
