import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContainerModule } from "@/components/packlog/ContainerModule";
import { PackChecklistPanel } from "@/components/packlog/PackChecklistPanel";
import { AddContainerSheet } from "@/components/packlog/AddContainerSheet";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { communityTemplates } from "@/lib/packlog-data";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { tripTotalGrams } from "@/lib/trip-weight-stats";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import type { PackViewFilter } from "@/lib/pack-view-filter";

export const Route = createFileRoute("/trip/$tripId/pack")({
  component: TripPackPage,
});

function TripPackPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const store = usePacklog();
  const trip = store.getTrip(tripId);
  const [addBagOpen, setAddBagOpen] = useState(false);
  const [packViewFilter, setPackViewFilter] = useState<PackViewFilter>("all");

  const main = useMemo(() => trip?.containers ?? [], [trip]);

  const packFilterCounts = useMemo(() => {
    if (!trip) return { all: 0, todo: 0, packed: 0, wishlist: 0 };
    const items = trip.containers.flatMap((c) => c.items);
    return {
      all: items.length,
      todo: items.filter((i) => i.status !== "packed").length,
      packed: items.filter((i) => i.status === "packed").length,
      wishlist: items.filter((i) => i.ownership === "wishlist").length,
    };
  }, [trip]);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind === "communityClone" && d.tripId === tripId) {
        const tpl = communityTemplates.find((x) => x.id === d.templateId);
        if (tpl) store.cloneCommunity(tripId, tpl, d.selectedIdx, d.targetContainerId);
        return;
      }
      if (d.kind === "saveItemToLibrary" && d.tripId === tripId) {
        const tr = store.getTrip(tripId);
        const c = tr?.containers.find((x) => x.id === d.containerId);
        const item = c?.items.find((x) => x.id === d.itemId);
        if (item) store.addToLibrary(item);
        return;
      }
      if (d.kind === "tripSharing" && d.tripId === tripId) {
        store.patchTrip(tripId, d.patch);
        return;
      }
      if (d.kind === "communityClone" && d.tripId === tripId) {
        const tpl = communityTemplates.find((x) => x.id === d.templateId);
        if (tpl) store.cloneCommunity(tripId, tpl, d.selectedIdx, d.targetContainerId);
      }
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [tripId, store]);

  if (!trip) {
    return (
      <div className="min-h-dvh overscroll-y-none bg-background pb-[env(safe-area-inset-bottom)]">
        <header className="border-b border-border px-4 py-3 pt-[env(safe-area-inset-top)]">
          <Link
            to="/"
            className="font-mono text-[10px] tracking-[0.2em] text-[#6B5234] underline-offset-2 hover:underline"
          >
            {t("archive.back")}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t("archive.empty")}</p>
        </header>
      </div>
    );
  }

  const phase = trip.phase;
  const totalItems = trip.containers.reduce((s, c) => s + c.items.length, 0);
  const packedItems = trip.containers.reduce(
    (s, c) => s + c.items.filter((i) => i.status === "packed").length,
    0,
  );
  const pct = totalItems ? (packedItems / totalItems) * 100 : 0;
  const totalG = tripTotalGrams(trip);

  return (
    <div className="min-h-dvh overscroll-y-none bg-background pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 border-b border-[#E8E2D9] bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/trip/$tripId", params: { tripId: trip.id } })}
            className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-[#6B5234] hover:underline"
          >
            {t("pack.page.back")}
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate font-display text-base font-semibold leading-tight">
              {trip.title}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {packedItems}/{totalItems} ✓ · {formatKgFromGrams(totalG)}kg
            </div>
          </div>
          <div className="w-10 shrink-0" aria-hidden />
        </div>
        <div className="px-4 pb-2">
          <div className="relative h-1.5 overflow-hidden rounded bg-surface-3">
            <motion.div
              className={`absolute inset-y-0 left-0 ${pct >= 100 ? "bg-success" : "bg-signal"}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        </div>
      </header>

      {phase !== "REVIEW" ? (
        <div className="border-b border-[#E8E2D9] bg-background/90 px-4 py-2 md:px-6">
          <div className="mx-auto flex max-w-[1480px] flex-wrap gap-1.5">
            {(
              [
                ["all", packFilterCounts.all] as const,
                ["todo", packFilterCounts.todo] as const,
                ["packed", packFilterCounts.packed] as const,
                ["wishlist", packFilterCounts.wishlist] as const,
              ] as const
            ).map(([key, n]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPackViewFilter(key)}
                className={`min-h-9 rounded-md border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em] transition md:px-3 ${
                  packViewFilter === key
                    ? "border-signal bg-signal text-signal-foreground"
                    : "border-border-strong bg-surface text-muted-foreground hover:border-signal hover:text-foreground"
                }`}
              >
                {t(`pack.filter.${key}`).replace("{n}", String(n))}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-4 md:px-6">
        <AnimatePresence mode="wait">
          {phase !== "REVIEW" ? (
            <motion.div
              key="containers"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <PackChecklistPanel
                  trip={trip}
                  phase={phase}
                  tripId={trip.id}
                  packViewFilter={packViewFilter}
                  onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                  onCycleOwnership={(cid, iid) => store.cycleOwnership(trip.id, cid, iid)}
                  onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
                  onMoveItem={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
                  onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
                  onAddToContainer={(cid, item) => store.addItem(trip.id, cid, item)}
                  onSaveToLibrary={(item) => store.addToLibrary(item)}
                  isInLibrary={(item) =>
                    store.library.some(
                      (g) => g.name === item.name && (g.brand ?? "") === (item.brand ?? ""),
                    )
                  }
                />
              </div>
              <div className="md:col-span-2 border-b border-border pb-2">
                <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                  {t("bags.sectionKicker")}
                </div>
                <h3 className="mt-1 font-display text-xl">{t("bags.sectionTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("bags.sectionHint")}</p>
              </div>
              {main[0] && (
                <div className="md:col-span-2">
                  <ContainerModule
                    container={main[0]}
                    phase={phase}
                    tripId={trip.id}
                    packViewFilter={packViewFilter}
                    onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                    onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                    onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                    onAdd={(cid, item) => store.addItem(trip.id, cid, item)}
                    onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
                    onMove={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
                    onDropFromPool={(cid, item) => store.addItem(trip.id, cid, item)}
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
                  tripId={trip.id}
                  packViewFilter={packViewFilter}
                  onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                  onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                  onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                  onAdd={(cid, item) => store.addItem(trip.id, cid, item)}
                  onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
                  onMove={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
                  onDropFromPool={(cid, item) => store.addItem(trip.id, cid, item)}
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
                  type="button"
                  onClick={() => setAddBagOpen(true)}
                  className="flex w-full min-h-11 items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface/50 py-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition hover:border-signal hover:bg-signal-soft hover:text-signal"
                >
                  {t("container.add.bag")}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="review-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground"
            >
              {t("pack.page.reviewHint")}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E8E2D9] bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-2 px-4 py-3">
          {phase !== "REVIEW" ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md border border-signal bg-signal px-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-signal-foreground shadow-sm transition hover:opacity-95"
                onClick={() =>
                  document.getElementById("pack-checklist")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                {t("pack.footer.scrollChecklist")}
              </button>
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md border border-border-strong bg-surface px-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-foreground transition hover:border-signal hover:bg-signal-soft"
                onClick={() =>
                  document.getElementById("pack-checklist-add")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                {t("pack.footer.addGear")}
              </button>
            </div>
          ) : null}
          <Link
            to="/community"
            className="text-center font-mono text-[10px] text-[#6B5234] underline underline-offset-2"
          >
            {t("brief.cta.clone")}
          </Link>
          <p className="text-center font-mono text-[9px] text-muted-foreground">
            {t("pack.page.footerHint")}
          </p>
        </div>
      </div>

      <AddContainerSheet
        open={addBagOpen}
        onClose={() => setAddBagOpen(false)}
        onCommit={(draft) => store.addContainer(trip.id, draft)}
      />
    </div>
  );
}
