import type { GearSpec, Trip } from "./packlog-data";
import { createClient } from "@supabase/supabase-js";
import {
  packlogSnapshotSchema,
  packlogSnapshotVersion,
  type PacklogSnapshot,
} from "./packlog-schema";

const STORAGE_KEY = "packlog.snapshot.v1";

type SeedState = {
  trips: Trip[];
  library: GearSpec[];
};

export interface PacklogRepository {
  load: () => Promise<SeedState>;
  save: (state: SeedState) => Promise<void>;
  clear: () => Promise<void>;
}

function toSnapshot(state: SeedState): PacklogSnapshot {
  return {
    version: packlogSnapshotVersion,
    updatedAt: new Date().toISOString(),
    trips: state.trips,
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

export function createBrowserPacklogRepository(seed: SeedState): PacklogRepository {
  const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

  return {
    load: async () => {
      if (!canUseStorage()) return seed;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed;

      const snapshot = parseSnapshot(raw);
      if (!snapshot) {
        window.localStorage.removeItem(STORAGE_KEY);
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    },
    clear: async () => {
      if (!canUseStorage()) return;
      window.localStorage.removeItem(STORAGE_KEY);
    },
  };
}

type SupabaseRepositoryOptions = {
  seed: SeedState;
  projectUrl: string;
  anonKey: string;
  workspace: string;
};

export function createSupabasePacklogRepository(options: SupabaseRepositoryOptions): PacklogRepository {
  const { seed, projectUrl, anonKey, workspace } = options;
  const client = createClient(projectUrl, anonKey);
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

      if (error || !data?.snapshot) return seed;
      const snapshot = parseSnapshotPayload(data.snapshot);
      if (!snapshot) return seed;
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

export function createPacklogRepository(seed: SeedState): PacklogRepository {
  const backend = getEnv("VITE_DATA_BACKEND") ?? "local";
  const projectUrl = getEnv("VITE_SUPABASE_URL");
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
  const workspace = getEnv("VITE_PACKLOG_WORKSPACE") ?? "default";

  if (backend === "supabase" && projectUrl && anonKey) {
    return createSupabasePacklogRepository({
      seed,
      projectUrl,
      anonKey,
      workspace,
    });
  }
  return createBrowserPacklogRepository(seed);
}
