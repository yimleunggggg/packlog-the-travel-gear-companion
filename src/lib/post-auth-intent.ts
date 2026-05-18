/** Persisted across magic-link / OAuth redirects so flows resume after sign-in. */

export const POST_AUTH_EVENT = "packlog:post-auth";

export type PostAuthIntent =
  | { v: 1; kind: "openNewTrip" }
  | {
      v: 1;
      kind: "communityClone";
      tripId: string;
      templateId: string;
      selectedIdx: number[];
      targetContainerId: string;
      ownership: "owned" | "wishlist" | "borrowed" | "undecided";
    }
  | { v: 1; kind: "libraryAddGear"; gearId: string; tripId: string }
  | {
      v: 1;
      kind: "tripSharing";
      tripId: string;
      patch: Partial<{ isPublic: boolean; tags: string[] }>;
    }
  | {
      v: 1;
      kind: "saveItemToLibrary";
      tripId: string;
      containerId: string;
      itemId: string;
    };

const STORAGE_KEY = "packlog.postAuthIntent.v1";
const POST_AUTH_INTENT_TTL_MS = 15 * 60 * 1000;

type StoredPostAuthIntent = {
  intent: PostAuthIntent;
  expiresAt: number;
};

function isPostAuthIntent(value: unknown): value is PostAuthIntent {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { v?: unknown; kind?: unknown };
  return maybe.v === 1 && typeof maybe.kind === "string";
}

export function parseStoredPostAuthIntent(raw: string, now = Date.now()): PostAuthIntent | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPostAuthIntent>;
    if (
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now ||
      !isPostAuthIntent(parsed.intent)
    ) {
      return null;
    }
    return parsed.intent;
  } catch {
    return null;
  }
}

export function storePostAuthIntent(intent: PostAuthIntent): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        intent,
        expiresAt: Date.now() + POST_AUTH_INTENT_TTL_MS,
      } satisfies StoredPostAuthIntent),
    );
  } catch {
    /* ignore quota */
  }
}

export function peekPostAuthIntent(): PostAuthIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseStoredPostAuthIntent(raw);
  } catch {
    return null;
  }
}

export function consumePostAuthIntent(): PostAuthIntent | null {
  const intent = peekPostAuthIntent();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return intent;
}

export function clearPostAuthIntent(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
