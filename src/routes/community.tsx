import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/packlog/TopBar";
import { CloneSheet } from "@/components/packlog/CloneSheet";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { communityTemplates, type CommunityTemplate } from "@/lib/packlog-data";
import { motion } from "framer-motion";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Kits · PACKLOG" },
      { name: "description", content: "Reference packing kits from the community — copy any blueprint into your trip." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { t, lang } = useI18n();
  const { trips, cloneCommunity } = usePacklog();
  const [tpl, setTpl] = useState<CommunityTemplate | null>(null);
  const [targetTripId, setTargetTripId] = useState<string>(
    trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]?.id ?? "",
  );
  const targetTrip = trips.find((t) => t.id === targetTripId);

  return (
    <div className="min-h-screen pb-24">
      <TopBar showPhase={false} />
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
              {t("community.head")}
            </div>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">
              {t("community.title")}
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {t("community.merge.subtitle")}
            </p>
          </div>

          {trips.length > 0 && (
            <div className="rounded-md border border-border bg-surface-2 p-2">
              <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                {t("community.merge.target")}
              </div>
              <select
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
                className="mt-1 bg-transparent font-mono text-xs focus:outline-none"
              >
                {trips.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.id} · {tr.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communityTemplates.map((c, i) => (
            <motion.button
              key={c.id}
              onClick={() => setTpl(c)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="module corner-tick group relative p-4 text-left transition hover:-translate-y-0.5"
            >
              <div className="font-mono text-[10px] tracking-[0.18em] text-signal">
                {t(`scenario.${c.scenario}`)} · ★ {c.rating}
              </div>
              <h3 className="mt-1 font-display text-xl leading-tight">
                {lang === "zh" ? (c.titleZh ?? c.title) : c.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {lang === "zh" ? (c.introZh ?? c.intro) : c.intro}
              </p>
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>{c.author}</span>
                <span>{c.items.length} {t("community.items")} · {c.totalWeight}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.tags.map((tag) => (
                  <span key={tag} className="tag-chip">#{tag}</span>
                ))}
              </div>
              <div className="mt-3 inline-block border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground transition group-hover:border-signal group-hover:bg-signal group-hover:text-signal-foreground">
                {t("community.clone")}
              </div>
            </motion.button>
          ))}
        </div>

        {trips.length === 0 && (
          <div className="module corner-tick p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("archive.empty")}
            </p>
            <Link
              to="/"
              className="mt-3 inline-block rounded border border-signal bg-signal px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-signal-foreground"
            >
              {t("archive.back")}
            </Link>
          </div>
        )}
      </main>

      <CloneSheet
        template={tpl}
        containers={targetTrip?.containers ?? []}
        onClose={() => setTpl(null)}
        onCommit={(idx, target) => {
          if (tpl && targetTrip) cloneCommunity(targetTrip.id, tpl, idx, target);
        }}
      />
    </div>
  );
}
