import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import {
  seedTrips,
  gearLibrary as initialGearLibrary,
  makeFreshTrip,
  type Trip,
  type Item,
  type LifecyclePhase,
  type CommunityTemplate,
  type GearSpec,
} from "@/lib/packlog-data";
import { TopBar } from "@/components/packlog/TopBar";
import { TripBriefing } from "@/components/packlog/TripBriefing";
import { ContainerModule } from "@/components/packlog/ContainerModule";
import { ParameterBus } from "@/components/packlog/ParameterBus";
import { CommunityRail } from "@/components/packlog/CommunityRail";
import { PostTripReview } from "@/components/packlog/PostTripReview";
import { GearLibraryPanel } from "@/components/packlog/GearLibraryPanel";
import { NewTripDialog } from "@/components/packlog/NewTripDialog";
import { CloneSheet } from "@/components/packlog/CloneSheet";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PACKLOG · 行前志 — Modular gear lifecycle for travelers" },
      {
        name: "description",
        content:
          "PACKLOG is a parametric, modular packing system that turns each trip into reusable gear-DNA. From plan, to pack, to debrief — your gear is professionally taken over.",
      },
      { property: "og:title", content: "PACKLOG · 行前志" },
      {
        property: "og:description",
        content:
          "Container-based packing, lifecycle states, community blueprints. Built for travelers who treat gear as a system.",
      },
    ],
  }),
  component: PackLogApp,
});

function PackLogApp() {
  const { t } = useI18n();
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const [activeId, setActiveId] = useState<string>(seedTrips[0].id);
  const [library, setLibrary] = useState<GearSpec[]>(initialGearLibrary);
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [cloneTpl, setCloneTpl] = useState<CommunityTemplate | null>(null);
  const containersRef = useRef<HTMLDivElement | null>(null);

  const trip = trips.find((t) => t.id === activeId) ?? trips[0];
  const phase = trip.phase;

  const updateTrip = (mutator: (t: Trip) => Trip) =>
    setTrips((cur) => cur.map((t) => (t.id === activeId ? mutator(t) : t)));

  const setPhase = (p: LifecyclePhase) => updateTrip((t) => ({ ...t, phase: p }));

  const onToggle = (containerId: string, itemId: string) =>
    updateTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.id !== itemId
                  ? i
                  : { ...i, status: i.status === "packed" ? "todo" : "packed" },
              ),
            },
      ),
    }));

  const onVerdict = (
    containerId: string,
    itemId: string,
    v: Item["verdict"],
  ) =>
    updateTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) => (i.id !== itemId ? i : { ...i, verdict: v })),
            },
      ),
    }));

  const onUtility = (containerId: string, itemId: string, u: number) =>
    updateTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.id !== itemId ? i : { ...i, utility: u === 0 ? null : u },
              ),
            },
      ),
    }));

  const onAdd = (containerId: string, item: Omit<Item, "id">) =>
    updateTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                {
                  ...item,
                  id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                },
              ],
            },
      ),
    }));

  const onRemove = (containerId: string, itemId: string) =>
    updateTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : { ...c, items: c.items.filter((i) => i.id !== itemId) },
      ),
    }));

  // Quick-add suggestions → drop into personal carry
  const onQuickAdd = (name: string, weightG: number, category: string) => {
    const target = trip.containers.find((c) => c.type === "personal") ?? trip.containers[0];
    onAdd(target.id, {
      gearId: null,
      name,
      qty: 1,
      weightG,
      category: category as Item["category"],
      status: "todo",
      verdict: null,
      utility: null,
    });
  };

  // Add from gear library — drop into a sensible container
  const onAddFromLibrary = (g: GearSpec) => {
    const target =
      g.category === "optic"
        ? trip.containers.find((c) => c.type === "camera") ??
          trip.containers.find((c) => c.type === "personal") ??
          trip.containers[0]
        : g.category === "doc" || g.category === "tech"
          ? trip.containers.find((c) => c.type === "personal") ?? trip.containers[0]
          : trip.containers.find((c) => c.type === "checked") ?? trip.containers[0];
    onAdd(target.id, {
      gearId: g.id,
      name: g.name,
      qty: 1,
      weightG: g.weightG,
      category: g.category,
      status: "todo",
      verdict: null,
      utility: null,
    });
  };

  // Community clone → merge selected items into target container
  const onCloneCommit = (selectedIdx: number[], targetContainerId: string) => {
    if (!cloneTpl) return;
    updateTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== targetContainerId
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                ...selectedIdx.map((i) => {
                  const it = cloneTpl.items[i];
                  return {
                    id: `clone-${Date.now()}-${i}`,
                    gearId: null,
                    name: it.name,
                    qty: it.qty,
                    weightG: it.weightG,
                    category: it.category,
                    status: "todo" as const,
                    verdict: null,
                    utility: null,
                    note: it.why,
                  };
                }),
              ],
            },
      ),
    }));
  };

  // Create a new trip
  const onCreateTrip = (args: Parameters<typeof makeFreshTrip>[0]) => {
    const fresh = makeFreshTrip(args);
    setTrips((cur) => [fresh, ...cur]);
    setActiveId(fresh.id);
    setNewTripOpen(false);
  };

  // Seal review → write per-item verdicts back to the gear library history
  const onSealReview = () => {
    const newHistory: { gearId: string; entry: Parameters<typeof Object>[0] }[] = [];
    trip.containers.forEach((c) =>
      c.items.forEach((i) => {
        if (i.gearId && i.verdict) {
          newHistory.push({
            gearId: i.gearId,
            entry: {
              tripId: trip.id,
              tripTitle: trip.title,
              date: trip.startDate.slice(0, 7),
              verdict: i.verdict,
              utility: i.utility ?? 3,
              note: i.note ?? "",
            },
          });
        }
      }),
    );
    if (newHistory.length === 0) return;
    setLibrary((lib) =>
      lib.map((g) => {
        const matches = newHistory.filter((h) => h.gearId === g.id).map((h) => h.entry as never);
        if (!matches.length) return g;
        return { ...g, history: [...matches, ...g.history] };
      }),
    );
  };

  const main = useMemo(() => trip.containers, [trip.containers]);

  const scrollToContainers = () =>
    containersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen pb-24">
      <TopBar phase={phase} onPhase={setPhase} />

      <main className="mx-auto max-w-[1480px] space-y-6 px-6 py-6">
        <TripBriefing
          trip={trip}
          trips={trips}
          onSwitchTrip={setActiveId}
          onNewTrip={() => setNewTripOpen(true)}
          onOpenClone={() => setCloneTpl(trips.length > 0 ? null : null) /* opens via rail click */}
          onContinue={scrollToContainers}
        />

        <div ref={containersRef} className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <AnimatePresence mode="wait">
              {phase !== "REVIEW" ? (
                <motion.div
                  key="containers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <div className="md:col-span-2">
                    <ContainerModule
                      container={main[0]}
                      phase={phase}
                      onToggle={onToggle}
                      onVerdict={onVerdict}
                      onUtility={onUtility}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      variant="wide"
                    />
                  </div>
                  {main.slice(1).map((c) => (
                    <ContainerModule
                      key={c.id}
                      container={c}
                      phase={phase}
                      onToggle={onToggle}
                      onVerdict={onVerdict}
                      onUtility={onUtility}
                      onAdd={onAdd}
                      onRemove={onRemove}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <PostTripReview onSeal={onSealReview} />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {main.map((c) => (
                      <ContainerModule
                        key={c.id}
                        container={c}
                        phase={phase}
                        onToggle={onToggle}
                        onVerdict={onVerdict}
                        onUtility={onUtility}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-4">
            <ParameterBus trip={trip} onQuickAdd={onQuickAdd} />
            <CommunityRail scenario={trip.scenario} onPreview={(tpl) => setCloneTpl(tpl)} />
          </div>
        </div>

        {/* Gear library lives below the main grid - persistent across trips */}
        <GearLibraryPanel library={library} onAddToTrip={onAddFromLibrary} />

        <footer className="module corner-tick relative grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
          {[
            [t("footer.doc"), trip.id],
            [t("footer.build"), "PL · 0.6.0 · FIELD"],
            [t("footer.encoding"), "UTF-8 / KGM / ML"],
            [t("footer.signed"), "@you · 2026.04.23"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">{k}</div>
              <div className="mt-1 font-mono text-xs">{v}</div>
            </div>
          ))}
        </footer>
      </main>

      <NewTripDialog
        open={newTripOpen}
        onClose={() => setNewTripOpen(false)}
        onCreate={onCreateTrip}
      />
      <CloneSheet
        template={cloneTpl}
        containers={trip.containers}
        onClose={() => setCloneTpl(null)}
        onCommit={onCloneCommit}
      />
    </div>
  );
}
