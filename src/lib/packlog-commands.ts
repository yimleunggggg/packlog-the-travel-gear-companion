import type {
  CommunityTemplate,
  Container,
  GearReview,
  GearSpec,
  Item,
  LifecyclePhase,
  Trip,
} from "./packlog-data";
import { itemNameKeys, mergedScenarioSeedsForTrip } from "./packing-pool";

function withUpdatedItem(
  trip: Trip,
  containerId: string,
  itemId: string,
  mutate: (item: Item) => Item,
): Trip {
  return {
    ...trip,
    containers: trip.containers.map((container) =>
      container.id !== containerId
        ? container
        : {
            ...container,
            items: container.items.map((item) => (item.id !== itemId ? item : mutate(item))),
          },
    ),
  };
}

function createClientId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function setTripPhase(trip: Trip, phase: LifecyclePhase): Trip {
  return { ...trip, phase };
}

export function toggleTripItem(trip: Trip, containerId: string, itemId: string): Trip {
  return withUpdatedItem(trip, containerId, itemId, (item) => ({
    ...item,
    status: item.status === "packed" ? "todo" : "packed",
  }));
}

export function setTripItemVerdict(
  trip: Trip,
  containerId: string,
  itemId: string,
  verdict: Item["verdict"],
): Trip {
  return withUpdatedItem(trip, containerId, itemId, (item) => ({ ...item, verdict }));
}

export function setTripItemUtility(
  trip: Trip,
  containerId: string,
  itemId: string,
  utility: number,
): Trip {
  return withUpdatedItem(trip, containerId, itemId, (item) => ({
    ...item,
    utility: utility === 0 ? null : utility,
  }));
}

export function cycleTripItemOwnership(trip: Trip, containerId: string, itemId: string): Trip {
  return withUpdatedItem(trip, containerId, itemId, (item) => {
    const order: Item["ownership"][] = ["owned", "wishlist", "borrowed", "undecided"];
    const next = order[(order.indexOf(item.ownership) + 1) % order.length];
    return { ...item, ownership: next };
  });
}

export function addTripItem(trip: Trip, containerId: string, item: Omit<Item, "id">): Trip {
  return {
    ...trip,
    containers: trip.containers.map((container) =>
      container.id !== containerId
        ? container
        : {
            ...container,
            items: [...container.items, { ...item, id: createClientId("usr") }],
          },
    ),
  };
}

export function updateTripItem(
  trip: Trip,
  containerId: string,
  itemId: string,
  patch: Partial<Item>,
): Trip {
  return withUpdatedItem(trip, containerId, itemId, (item) => ({ ...item, ...patch }));
}

export function removeTripItem(trip: Trip, containerId: string, itemId: string): Trip {
  const container = trip.containers.find((c) => c.id === containerId);
  const removed = container?.items.find((i) => i.id === itemId);

  const next: Trip = {
    ...trip,
    containers: trip.containers.map((c) =>
      c.id !== containerId ? c : { ...c, items: c.items.filter((item) => item.id !== itemId) },
    ),
  };

  if (!removed) return next;

  const scenarioSeeds = mergedScenarioSeedsForTrip(trip);
  const removedKeys = itemNameKeys(removed);
  const seedNormsFromRemoved = scenarioSeeds
    .map((s) => s.en.trim().toLowerCase())
    .filter((n) => removedKeys.includes(n));

  if (seedNormsFromRemoved.length === 0) return next;

  const stillPacked = new Set<string>();
  for (const c of next.containers) {
    for (const it of c.items) {
      for (const k of itemNameKeys(it)) stillPacked.add(k);
    }
  }

  const toDismiss = seedNormsFromRemoved.filter((k) => !stillPacked.has(k));
  if (toDismiss.length === 0) return next;

  const prev = trip.dismissedScenarioSeeds ?? [];
  const mergedDismissed = [...new Set([...prev, ...toDismiss])];
  return { ...next, dismissedScenarioSeeds: mergedDismissed };
}

export function moveTripItem(
  trip: Trip,
  fromContainerId: string,
  itemId: string,
  toContainerId: string,
): Trip {
  const fromContainer = trip.containers.find((container) => container.id === fromContainerId);
  const item = fromContainer?.items.find((candidate) => candidate.id === itemId);
  if (!fromContainer || !item) return trip;

  return {
    ...trip,
    containers: trip.containers.map((container) => {
      if (container.id === fromContainerId) {
        return {
          ...container,
          items: container.items.filter((candidate) => candidate.id !== itemId),
        };
      }
      if (container.id === toContainerId) {
        return { ...container, items: [...container.items, item] };
      }
      return container;
    }),
  };
}

export function cloneCommunityTemplateToTrip(
  trip: Trip,
  template: CommunityTemplate,
  selectedIndexes: number[],
  targetContainerId: string,
): Trip {
  return {
    ...trip,
    containers: trip.containers.map((container) =>
      container.id !== targetContainerId
        ? container
        : {
            ...container,
            items: [
              ...container.items,
              ...selectedIndexes.map((index) => {
                const item = template.items[index];
                return {
                  id: createClientId("cp"),
                  gearId: null,
                  name: item.name,
                  nameEn: item.name,
                  nameZh: item.nameZh,
                  qty: item.qty,
                  weightG: item.weightG,
                  weightSource: "library" as const,
                  category: item.category,
                  status: "todo" as const,
                  verdict: null,
                  utility: null,
                  ownership: "owned" as const,
                  note: item.why,
                };
              }),
            ],
          },
    ),
  };
}

export function addTripContainer(
  trip: Trip,
  draft: Omit<Container, "id" | "code" | "items">,
): Trip {
  const nextIndex = trip.containers.length + 1;
  const code = `C-${String(nextIndex).padStart(2, "0")}`;
  const newContainer: Container = {
    ...draft,
    id: `c-${Date.now().toString(36)}`,
    code,
    items: [],
  };
  return { ...trip, containers: [...trip.containers, newContainer] };
}

export function removeTripContainer(trip: Trip, containerId: string): Trip {
  return {
    ...trip,
    containers: trip.containers.filter((container) => container.id !== containerId),
  };
}

export function buildLibrarySpecFromItem(item: Item): GearSpec {
  return {
    id: `g-usr-${Date.now().toString(36)}`,
    name: item.name,
    nameEn: item.nameEn ?? item.name,
    nameZh: item.nameZh,
    brand: item.brand,
    sku: item.sku,
    weightG: item.weightG,
    category: item.category,
    description: item.note ?? "",
    ownership: item.ownership,
    ownedSince: new Date().toISOString().slice(0, 7).replace("-", "."),
    history: [],
  };
}

export function mergeLibrarySpec(library: GearSpec[], spec: GearSpec): GearSpec[] {
  return library.some(
    (gear) => gear.name === spec.name && (gear.brand ?? "") === (spec.brand ?? ""),
  )
    ? library
    : [spec, ...library];
}

export function collectReviewEntries(trip: Trip): Array<{ gearId: string; entry: GearReview }> {
  const entries: Array<{ gearId: string; entry: GearReview }> = [];
  trip.containers.forEach((container) => {
    container.items.forEach((item) => {
      if (!item.gearId || !item.verdict) return;
      entries.push({
        gearId: item.gearId,
        entry: {
          tripId: trip.id,
          tripTitle: trip.title,
          date: trip.startDate.slice(0, 7),
          verdict: item.verdict,
          utility: item.utility ?? 3,
          note: item.note ?? "",
        },
      });
    });
  });
  return entries;
}

export function applyReviewEntriesToLibrary(
  library: GearSpec[],
  entries: Array<{ gearId: string; entry: GearReview }>,
): GearSpec[] {
  if (!entries.length) return library;
  return library.map((gear) => {
    const matches = entries.filter((entry) => entry.gearId === gear.id).map((entry) => entry.entry);
    if (!matches.length) return gear;
    return { ...gear, history: [...matches, ...gear.history] };
  });
}
