import type { Container, Item, Trip } from "./packlog-data";

/** Default bag for new items by category — matches `addFromLibrary` routing. */
export function preferredContainerForCategory(
  trip: Trip,
  category: Item["category"],
): Container | undefined {
  const { containers } = trip;
  if (!containers.length) return undefined;
  if (category === "optic") {
    return (
      containers.find((c) => c.type === "camera") ??
      containers.find((c) => c.type === "personal") ??
      containers[0]
    );
  }
  if (category === "doc" || category === "tech") {
    return containers.find((c) => c.type === "personal") ?? containers[0];
  }
  return containers.find((c) => c.type === "checked") ?? containers[0];
}

export function preferredContainerIdForCategory(
  trip: Trip,
  category: Item["category"],
): string | undefined {
  return preferredContainerForCategory(trip, category)?.id;
}
