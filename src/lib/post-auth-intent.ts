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

export function storePostAuthIntent(intent: PostAuthIntent): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    /* ignore quota */
  }
}

export function peekPostAuthIntent(): PostAuthIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PostAuthIntent;
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
