import { useSyncExternalStore } from "react";

/**
 * Subscribes to `window.matchMedia`. SSR / first paint uses `getServerSnapshot` (default false = mobile-first).
 */
export function useMediaQuery(query: string, getServerSnapshot = () => false): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => (typeof window === "undefined" ? getServerSnapshot() : window.matchMedia(query).matches),
    getServerSnapshot,
  );
}
