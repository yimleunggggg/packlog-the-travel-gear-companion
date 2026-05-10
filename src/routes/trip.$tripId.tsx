import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/packlog/TopBar";
import { TripBriefing } from "@/components/packlog/TripBriefing";
import { ContainerModule } from "@/components/packlog/ContainerModule";
import { ParameterBus } from "@/components/packlog/ParameterBus";
import { CommunityRail } from "@/components/packlog/CommunityRail";
import { PostTripReview } from "@/components/packlog/PostTripReview";
import { CloneSheet } from "@/components/packlog/CloneSheet";
import { AddContainerSheet } from "@/components/packlog/AddContainerSheet";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import type { CommunityTemplate } from "@/lib/packlog-data";

export const Route = createFileRoute("/trip/$tripId")({
  component: TripDetail,
});

function TripDetail() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const store = usePacklog();
  const trip = store.getTrip(tripId);
  const containersRef = useRef<HTMLDivElement | null>(null);
  const [cloneTpl, setCloneTpl] = useState<CommunityTemplate | null>(null);
  const [addBagOpen, setAddBagOpen] = useState(false);

  const main = useMemo(() => trip?.containers ?? [], [trip]);

  if (!trip) {
    return (
      <div className="min-h-screen">
        <TopBar showPhase={false} />
        <div className="mx-auto max-w-2xl p-12 text-center">
          <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">PACKLOG</div>
          <h1 className="mt-3 font-display text-3xl">Trip not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("archive.empty")}</p>
          <Link to="/" className="mt-5 inline-block rounded border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground">
            {t("archive.back")}
          </Link>
        </div>
      </div>
    );
  }

  const phase = trip.phase;
  const scrollToContainers = () =>
    containersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen pb-24">
      <TopBar phase={phase} onPhase={(p) => store.setPhase(trip.id, p)} />

      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <TripBriefing
          trip={trip}
          onBack={() => navigate({ to: "/" })}
          onOpenClone={() => navigate({ to: "/community" })}
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
                  {main[0] && (
                    <div className="md:col-span-2">
                      <ContainerModule
                        container={main[0]}
                        phase={phase}
                        onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                        onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                        onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                        onAdd={(cid, item) => store.addItem(trip.id, cid, item)}
                        onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
                        onMove={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
                        onCycleOwnership={(cid, iid) => store.cycleOwnership(trip.id, cid, iid)}
                        onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
                        onSaveToLibrary={(item) => store.addToLibrary(item)}
                        isInLibrary={(item) =>
                          store.library.some(
                            (g) => g.name === item.name && (g.brand ?? "") === (item.brand ?? ""),
                          )
                        }
                        variant="wide"
                      />
                    </div>
                  )}
                  {main.slice(1).map((c) => (
                    <ContainerModule
                      key={c.id}
                      container={c}
                      phase={phase}
                      onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                      onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                      onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                      onAdd={(cid, item) => store.addItem(trip.id, cid, item)}
                      onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
                      onMove={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
                      onCycleOwnership={(cid, iid) => store.cycleOwnership(trip.id, cid, iid)}
                      onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
                      onSaveToLibrary={(item) => store.addToLibrary(item)}
                      isInLibrary={(item) =>
                        store.library.some(
                          (g) => g.name === item.name && (g.brand ?? "") === (item.brand ?? ""),
                        )
                      }
                    />
                  ))}
                  <div className="md:col-span-2">
                    <button
                      onClick={() => setAddBagOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface/50 py-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition hover:border-signal hover:bg-signal-soft hover:text-signal"
                    >
                      {t("container.add.bag")}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <PostTripReview trip={trip} onSeal={() => store.sealReview(trip.id)} />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {main.map((c) => (
                      <ContainerModule
                        key={c.id}
                        container={c}
                        phase={phase}
                        onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                        onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                        onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-4">
            <ParameterBus
              trip={trip}
              onQuickAdd={(n, w, c) => store.quickAdd(trip.id, n, w, c)}
            />
            <CommunityRail scenario={trip.scenario} onPreview={(tpl) => setCloneTpl(tpl)} />
          </div>
        </div>
      </main>

      <CloneSheet
        template={cloneTpl}
        containers={trip.containers}
        onClose={() => setCloneTpl(null)}
        onCommit={(idx, target) => {
          if (cloneTpl) store.cloneCommunity(trip.id, cloneTpl, idx, target);
        }}
      />

      <AddContainerSheet
        open={addBagOpen}
        onClose={() => setAddBagOpen(false)}
        onCommit={(draft) => store.addContainer(trip.id, draft)}
      />
    </div>
  );
}
