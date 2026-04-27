import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  seedTrips,
  gearLibrary as initialGearLibrary,
  makeFreshTrip,
  type Trip,
  type Item,
  type GearSpec,
  type LifecyclePhase,
  type CommunityTemplate,
} from "./packlog-data";

type Ctx = {
  trips: Trip[];
  library: GearSpec[];
  getTrip: (id: string) => Trip | undefined;

  createTrip: (args: Parameters<typeof makeFreshTrip>[0]) => Trip;
  setPhase: (tripId: string, p: LifecyclePhase) => void;

  toggleItem: (tripId: string, containerId: string, itemId: string) => void;
  setVerdict: (tripId: string, containerId: string, itemId: string, v: Item["verdict"]) => void;
  setUtility: (tripId: string, containerId: string, itemId: string, u: number) => void;
  cycleOwnership: (tripId: string, containerId: string, itemId: string) => void;
  addItem: (tripId: string, containerId: string, item: Omit<Item, "id">) => void;
  updateItem: (tripId: string, containerId: string, itemId: string, patch: Partial<Item>) => void;
  removeItem: (tripId: string, containerId: string, itemId: string) => void;
  moveItem: (tripId: string, fromContainerId: string, itemId: string, toContainerId: string) => void;
  quickAdd: (tripId: string, name: string, weightG: number, category: string) => void;
  addFromLibrary: (tripId: string, gear: GearSpec) => void;
  addToLibrary: (item: Item) => GearSpec;
  cloneCommunity: (tripId: string, tpl: CommunityTemplate, selectedIdx: number[], targetContainerId: string) => void;

  sealReview: (tripId: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function PacklogProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const [library, setLibrary] = useState<GearSpec[]>(initialGearLibrary);

  const getTrip = useCallback((id: string) => trips.find((t) => t.id === id), [trips]);

  const updateTrip = useCallback((tripId: string, mutator: (t: Trip) => Trip) => {
    setTrips((cur) => cur.map((t) => (t.id === tripId ? mutator(t) : t)));
  }, []);

  const createTrip: Ctx["createTrip"] = useCallback((args) => {
    const fresh = makeFreshTrip(args);
    setTrips((cur) => [fresh, ...cur]);
    return fresh;
  }, []);

  const setPhase: Ctx["setPhase"] = (tripId, p) =>
    updateTrip(tripId, (t) => ({ ...t, phase: p }));

  const toggleItem: Ctx["toggleItem"] = (tripId, containerId, itemId) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.id !== itemId ? i : { ...i, status: i.status === "packed" ? "todo" : "packed" },
              ),
            },
      ),
    }));

  const setVerdict: Ctx["setVerdict"] = (tripId, containerId, itemId, v) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : { ...c, items: c.items.map((i) => (i.id !== itemId ? i : { ...i, verdict: v })) },
      ),
    }));

  const setUtility: Ctx["setUtility"] = (tripId, containerId, itemId, u) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) => (i.id !== itemId ? i : { ...i, utility: u === 0 ? null : u })),
            },
      ),
    }));

  const cycleOwnership: Ctx["cycleOwnership"] = (tripId, containerId, itemId) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) => {
                if (i.id !== itemId) return i;
                const order: Item["ownership"][] = ["owned", "wishlist", "undecided"];
                const next = order[(order.indexOf(i.ownership) + 1) % order.length];
                return { ...i, ownership: next };
              }),
            },
      ),
    }));

  const addItem: Ctx["addItem"] = (tripId, containerId, item) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                { ...item, id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
              ],
            },
      ),
    }));

  const updateItem: Ctx["updateItem"] = (tripId, containerId, itemId, patch) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : { ...c, items: c.items.map((i) => (i.id !== itemId ? i : { ...i, ...patch })) },
      ),
    }));

  const removeItem: Ctx["removeItem"] = (tripId, containerId, itemId) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId ? c : { ...c, items: c.items.filter((i) => i.id !== itemId) },
      ),
    }));

  const moveItem: Ctx["moveItem"] = (tripId, fromId, itemId, toId) =>
    updateTrip(tripId, (t) => {
      const from = t.containers.find((c) => c.id === fromId);
      const it = from?.items.find((i) => i.id === itemId);
      if (!from || !it) return t;
      return {
        ...t,
        containers: t.containers.map((c) => {
          if (c.id === fromId) return { ...c, items: c.items.filter((i) => i.id !== itemId) };
          if (c.id === toId) return { ...c, items: [...c.items, it] };
          return c;
        }),
      };
    });

  const quickAdd: Ctx["quickAdd"] = (tripId, name, weightG, category) => {
    const t = trips.find((x) => x.id === tripId);
    if (!t) return;
    const target = t.containers.find((c) => c.type === "personal") ?? t.containers[0];
    if (!target) return;
    addItem(tripId, target.id, {
      gearId: null,
      name,
      qty: 1,
      weightG,
      category: category as Item["category"],
      status: "todo",
      verdict: null,
      utility: null,
      ownership: "owned",
    });
  };

  const addFromLibrary: Ctx["addFromLibrary"] = (tripId, g) => {
    const t = trips.find((x) => x.id === tripId);
    if (!t) return;
    const target =
      g.category === "optic"
        ? t.containers.find((c) => c.type === "camera") ??
          t.containers.find((c) => c.type === "personal") ??
          t.containers[0]
        : g.category === "doc" || g.category === "tech"
          ? t.containers.find((c) => c.type === "personal") ?? t.containers[0]
          : t.containers.find((c) => c.type === "checked") ?? t.containers[0];
    if (!target) return;
    addItem(tripId, target.id, {
      gearId: g.id,
      name: g.name,
      nameEn: g.nameEn,
      nameZh: g.nameZh,
      qty: 1,
      weightG: g.weightG,
      weightSource: "library",
      category: g.category,
      status: "todo",
      verdict: null,
      utility: null,
      ownership: "owned",
    });
  };

  const addToLibrary: Ctx["addToLibrary"] = (item) => {
    const id = `g-usr-${Date.now().toString(36)}`;
    const spec: GearSpec = {
      id,
      name: item.name,
      nameEn: item.nameEn ?? item.name,
      nameZh: item.nameZh,
      brand: item.brand,
      weightG: item.weightG,
      category: item.category,
      description: item.note ?? "",
      ownership: item.ownership,
      ownedSince: new Date().toISOString().slice(0, 7).replace("-", "."),
      history: [],
    };
    setLibrary((lib) =>
      lib.some((g) => g.name === spec.name && (g.brand ?? "") === (spec.brand ?? "")) ? lib : [spec, ...lib],
    );
    return spec;
  };

  const cloneCommunity: Ctx["cloneCommunity"] = (tripId, tpl, selectedIdx, targetContainerId) =>
    updateTrip(tripId, (t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== targetContainerId
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                ...selectedIdx.map((i) => {
                  const it = tpl.items[i];
                  return {
                    id: `cp-${Date.now()}-${i}`,
                    gearId: null,
                    name: it.name,
                    nameEn: it.name,
                    nameZh: it.nameZh,
                    qty: it.qty,
                    weightG: it.weightG,
                    weightSource: "library" as const,
                    category: it.category,
                    status: "todo" as const,
                    verdict: null,
                    utility: null,
                    ownership: "owned" as const,
                    note: it.why,
                  };
                }),
              ],
            },
      ),
    }));

  const sealReview: Ctx["sealReview"] = (tripId) => {
    const t = trips.find((x) => x.id === tripId);
    if (!t) return;
    const newHistory: { gearId: string; entry: Parameters<typeof Object>[0] }[] = [];
    t.containers.forEach((c) =>
      c.items.forEach((i) => {
        if (i.gearId && i.verdict) {
          newHistory.push({
            gearId: i.gearId,
            entry: {
              tripId: t.id,
              tripTitle: t.title,
              date: t.startDate.slice(0, 7),
              verdict: i.verdict,
              utility: i.utility ?? 3,
              note: i.note ?? "",
            },
          });
        }
      }),
    );
    if (!newHistory.length) return;
    setLibrary((lib) =>
      lib.map((g) => {
        const matches = newHistory.filter((h) => h.gearId === g.id).map((h) => h.entry as never);
        if (!matches.length) return g;
        return { ...g, history: [...matches, ...g.history] };
      }),
    );
  };

  const value = useMemo<Ctx>(
    () => ({
      trips, library, getTrip,
      createTrip, setPhase,
      toggleItem, setVerdict, setUtility, cycleOwnership,
      addItem, removeItem, moveItem,
      quickAdd, addFromLibrary, cloneCommunity, sealReview,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips, library],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function usePacklog() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("usePacklog must be used inside PacklogProvider");
  return v;
}
