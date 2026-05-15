import type { Container, Trip } from "@/lib/packlog-data";

/** Stable id for the trip-level “not in a bag yet” bucket. */
export function unassignedContainerId(tripId: string): string {
  return `${tripId}-unassigned`;
}

export function isUnassignedContainer(container: Container, tripId: string): boolean {
  return container.id === unassignedContainerId(tripId);
}

export function ensureUnassignedContainer(trip: Trip): Trip {
  const id = unassignedContainerId(trip.id);
  if (trip.containers.some((c) => c.id === id)) return trip;
  const unassigned: Container = {
    id,
    code: "C-00",
    name: "Unassigned",
    nameZh: "待分类",
    type: "custom",
    capacityL: 40,
    maxKg: 50,
    items: [],
  };
  return { ...trip, containers: [unassigned, ...trip.containers] };
}

/** Bags shown in merge UI (excludes the internal unassigned bucket). */
export function assignableContainers(trip: Trip): Container[] {
  return trip.containers.filter((c) => !isUnassignedContainer(c, trip.id));
}
