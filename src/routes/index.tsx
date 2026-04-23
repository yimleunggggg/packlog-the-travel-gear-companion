import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  tripData,
  type Trip,
  type Item,
  type LifecyclePhase,
} from "@/lib/packlog-data";
import { TopBar } from "@/components/packlog/TopBar";
import { TripBriefing } from "@/components/packlog/TripBriefing";
import { ContainerModule } from "@/components/packlog/ContainerModule";
import { ParameterBus } from "@/components/packlog/ParameterBus";
import { CommunityRail } from "@/components/packlog/CommunityRail";
import { PostTripReview } from "@/components/packlog/PostTripReview";
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
  const [trip, setTrip] = useState<Trip>(tripData);
  const phase = trip.phase;

  const setPhase = (p: LifecyclePhase) => setTrip((t) => ({ ...t, phase: p }));

  const onToggle = (containerId: string, itemId: string) =>
    setTrip((t) => ({
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
    v: "keep" | "drop" | "upgrade" | null,
  ) =>
    setTrip((t) => ({
      ...t,
      containers: t.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.id !== itemId ? i : { ...i, verdict: v },
              ),
            },
      ),
    }));

  const onAdd = (containerId: string, item: Omit<Item, "id">) =>
    setTrip((t) => ({
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

  // Quick add from smart suggest panel — drops into the personal carry (most flexible)
  const onQuickAdd = (name: string, weightG: number, category: string) => {
    const targetIdx = trip.containers.findIndex((c) => c.type === "personal");
    const target = trip.containers[targetIdx >= 0 ? targetIdx : 0];
    onAdd(target.id, {
      name,
      qty: 1,
      weightG,
      category: category as Item["category"],
      status: "todo",
      verdict: null,
    });
  };

  const onClone = (id: string) => {
    setTrip((t) => ({
      ...t,
      containers: t.containers.map((c, idx) =>
        idx !== 0
          ? c
          : {
              ...c,
              items: [
                {
                  id: `clone-${Date.now()}`,
                  name: `Cloned · ${id.toUpperCase()} kit`,
                  qty: 1,
                  weightG: 240,
                  category: "misc" as const,
                  status: "todo" as const,
                  verdict: null,
                },
                ...c.items,
              ],
            },
      ),
    }));
  };

  const main = useMemo(() => trip.containers, [trip.containers]);

  return (
    <div className="min-h-screen pb-24">
      <TopBar phase={phase} onPhase={setPhase} />

      <main className="mx-auto max-w-[1480px] space-y-6 px-6 py-6">
        <TripBriefing trip={trip} />

        <div className="grid grid-cols-12 gap-6">
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
                      onAdd={onAdd}
                      variant="wide"
                    />
                  </div>
                  <ContainerModule
                    container={main[1]}
                    phase={phase}
                    onToggle={onToggle}
                    onVerdict={onVerdict}
                    onAdd={onAdd}
                  />
                  <ContainerModule
                    container={main[2]}
                    phase={phase}
                    onToggle={onToggle}
                    onVerdict={onVerdict}
                    onAdd={onAdd}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <PostTripReview />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {main.slice(0, 2).map((c) => (
                      <ContainerModule
                        key={c.id}
                        container={c}
                        phase={phase}
                        onToggle={onToggle}
                        onVerdict={onVerdict}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-4">
            <ParameterBus trip={trip} onQuickAdd={onQuickAdd} />
            <CommunityRail onClone={onClone} />
          </div>
        </div>

        <footer className="module corner-tick relative grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
          {[
            [t("footer.doc"), trip.id],
            [t("footer.build"), "PL · 0.5.0 · BLUEPRINT"],
            [t("footer.encoding"), "UTF-8 / KGM / ML"],
            [t("footer.signed"), "@you · 2026.04.23"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
                {k}
              </div>
              <div className="mt-1 font-mono text-xs">{v}</div>
            </div>
          ))}
        </footer>
      </main>
    </div>
  );
}
