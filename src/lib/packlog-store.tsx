import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  seedTrips,
  gearLibrary as initialGearLibrary,
  makeFreshTrip,
  type Trip,
  type Item,
  type Container,
  type GearSpec,
  type LifecyclePhase,
  type CommunityTemplate,
} from "./packlog-data";
import {
  addTripContainer,
  addTripItem,
  applyReviewEntriesToLibrary,
  buildLibrarySpecFromItem,
  cloneCommunityTemplateToTrip,
  collectReviewEntries,
  cycleTripItemOwnership,
  setTripItemOwnership,
  mergeLibrarySpec,
  moveTripItem,
  removeTripContainer,
  removeTripItem,
  setTripItemUtility,
  setTripItemVerdict,
  setTripPhase,
  toggleTripItem,
  updateTripItem,
} from "./packlog-commands";
import { preferredContainerForCategory } from "./preferred-container-for-category";
import { ensureUnassignedContainer, unassignedContainerId } from "./unassigned-container";
import { useAuth } from "./auth-context";
import { createPacklogRepository } from "./packlog-repository";

type Ctx = {
  trips: Trip[];
  library: GearSpec[];
  getTrip: (id: string) => Trip | undefined;

  createTrip: (args: Parameters<typeof makeFreshTrip>[0]) => Trip;
  patchTrip: (tripId: string, patch: Partial<Pick<Trip, "title" | "isPublic" | "tags">>) => void;
  setPhase: (tripId: string, p: LifecyclePhase) => void;

  toggleItem: (tripId: string, containerId: string, itemId: string) => void;
  setVerdict: (tripId: string, containerId: string, itemId: string, v: Item["verdict"]) => void;
  setUtility: (tripId: string, containerId: string, itemId: string, u: number) => void;
  cycleOwnership: (tripId: string, containerId: string, itemId: string) => void;
  setOwnership: (
    tripId: string,
    containerId: string,
    itemId: string,
    ownership: Item["ownership"],
  ) => void;
  addItem: (tripId: string, containerId: string, item: Omit<Item, "id">) => void;
  updateItem: (tripId: string, containerId: string, itemId: string, patch: Partial<Item>) => void;
  removeItem: (tripId: string, containerId: string, itemId: string) => void;
  moveItem: (
    tripId: string,
    fromContainerId: string,
    itemId: string,
    toContainerId: string,
  ) => void;
  quickAdd: (tripId: string, name: string, weightG: number, category: string) => void;
  addFromLibrary: (tripId: string, gear: GearSpec) => void;
  addToLibrary: (item: Item) => GearSpec;
  cloneCommunity: (
    tripId: string,
    tpl: CommunityTemplate,
    selectedIdx: number[],
    targetContainerId: string,
    ownership?: Item["ownership"],
  ) => void;
  addContainer: (tripId: string, draft: Omit<Container, "id" | "code" | "items">) => void;
  removeContainer: (tripId: string, containerId: string) => void;

  sealReview: (tripId: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function PacklogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const seedForRepo = useMemo(
    () =>
      user?.id
        ? { trips: [], library: initialGearLibrary }
        : { trips: seedTrips, library: initialGearLibrary },
    [user?.id],
  );
  const repository = useMemo(
    () => createPacklogRepository(seedForRepo, { userId: user?.id ?? null }),
    [seedForRepo, user?.id],
  );
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const [library, setLibrary] = useState<GearSpec[]>(initialGearLibrary);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    repository
      .load()
      .then((restored) => {
        if (!alive) return;
        setTrips(restored.trips);
        setLibrary(restored.library);
      })
      .catch((err) => {
        console.error("Failed to load packlog state", err);
      })
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      repository.save({ trips, library }).catch((err) => {
        console.error("Failed to persist packlog state", err);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [repository, trips, library, hydrated]);

  const getTrip = useCallback((id: string) => trips.find((t) => t.id === id), [trips]);

  const updateTrip = useCallback((tripId: string, mutator: (t: Trip) => Trip) => {
    setTrips((cur) => cur.map((t) => (t.id === tripId ? mutator(t) : t)));
  }, []);

  const createTrip: Ctx["createTrip"] = useCallback((args) => {
    const fresh = makeFreshTrip(args);
    setTrips((cur) => [fresh, ...cur]);
    return fresh;
  }, []);

  const patchTrip: Ctx["patchTrip"] = useCallback((tripId, patch) => {
    setTrips((cur) => cur.map((t) => (t.id === tripId ? { ...t, ...patch } : t)));
  }, []);

  const setPhase: Ctx["setPhase"] = (tripId, p) =>
    updateTrip(tripId, (trip) => setTripPhase(trip, p));

  const toggleItem: Ctx["toggleItem"] = (tripId, containerId, itemId) =>
    updateTrip(tripId, (trip) => toggleTripItem(trip, containerId, itemId));

  const setVerdict: Ctx["setVerdict"] = (tripId, containerId, itemId, v) =>
    updateTrip(tripId, (trip) => setTripItemVerdict(trip, containerId, itemId, v));

  const setUtility: Ctx["setUtility"] = (tripId, containerId, itemId, u) =>
    updateTrip(tripId, (trip) => setTripItemUtility(trip, containerId, itemId, u));

  const cycleOwnership: Ctx["cycleOwnership"] = (tripId, containerId, itemId) =>
    updateTrip(tripId, (trip) => cycleTripItemOwnership(trip, containerId, itemId));

  const setOwnership: Ctx["setOwnership"] = (tripId, containerId, itemId, ownership) =>
    updateTrip(tripId, (trip) => setTripItemOwnership(trip, containerId, itemId, ownership));

  const addItem: Ctx["addItem"] = (tripId, containerId, item) =>
    updateTrip(tripId, (trip) => {
      const t =
        containerId === unassignedContainerId(trip.id) ? ensureUnassignedContainer(trip) : trip;
      return addTripItem(t, containerId, item);
    });

  const updateItem: Ctx["updateItem"] = (tripId, containerId, itemId, patch) =>
    updateTrip(tripId, (trip) => updateTripItem(trip, containerId, itemId, patch));

  const removeItem: Ctx["removeItem"] = (tripId, containerId, itemId) =>
    updateTrip(tripId, (trip) => removeTripItem(trip, containerId, itemId));

  const moveItem: Ctx["moveItem"] = (tripId, fromId, itemId, toId) =>
    updateTrip(tripId, (trip) => moveTripItem(trip, fromId, itemId, toId));

  const quickAdd: Ctx["quickAdd"] = (tripId, name, weightG, category) => {
    updateTrip(tripId, (trip) => {
      const withUn = ensureUnassignedContainer(trip);
      return addTripItem(withUn, unassignedContainerId(trip.id), {
        gearId: null,
        name,
        qty: 1,
        weightG,
        weightSource: "user",
        category: category as Item["category"],
        status: "todo",
        verdict: null,
        utility: null,
        ownership: "owned",
      });
    });
  };

  const addFromLibrary: Ctx["addFromLibrary"] = (tripId, g) => {
    const t = trips.find((x) => x.id === tripId);
    if (!t) return;
    const target = preferredContainerForCategory(t, g.category);
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
    const spec = buildLibrarySpecFromItem(item);
    setLibrary((lib) => mergeLibrarySpec(lib, spec));
    return spec;
  };

  const cloneCommunity: Ctx["cloneCommunity"] = (
    tripId,
    tpl,
    selectedIdx,
    targetContainerId,
    ownership = "owned",
  ) =>
    updateTrip(tripId, (trip) =>
      cloneCommunityTemplateToTrip(trip, tpl, selectedIdx, targetContainerId, ownership),
    );

  const sealReview: Ctx["sealReview"] = (tripId) => {
    const trip = trips.find((x) => x.id === tripId);
    if (!trip) return;
    const entries = collectReviewEntries(trip);
    setLibrary((lib) => applyReviewEntriesToLibrary(lib, entries));
  };

  const addContainer: Ctx["addContainer"] = (tripId, draft) =>
    updateTrip(tripId, (trip) => addTripContainer(trip, draft));

  const removeContainer: Ctx["removeContainer"] = (tripId, containerId) =>
    updateTrip(tripId, (trip) => removeTripContainer(trip, containerId));

  const value = useMemo<Ctx>(
    () => ({
      trips,
      library,
      getTrip,
      createTrip,
      patchTrip,
      setPhase,
      toggleItem,
      setVerdict,
      setUtility,
      cycleOwnership,
      setOwnership,
      addItem,
      updateItem,
      removeItem,
      moveItem,
      quickAdd,
      addFromLibrary,
      addToLibrary,
      cloneCommunity,
      addContainer,
      removeContainer,
      sealReview,
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
