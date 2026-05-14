import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { communityTemplates, libraryCategoryMatchForTemplate, type Trip } from "@/lib/packlog-data";
import { motion } from "framer-motion";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community Kits · PACKLOG" },
      {
        name: "description",
        content: "Reference packing kits from the community — copy any blueprint into your trip.",
      },
    ],
  }),
  component: CommunityListPage,
});

function targetTripOptionLabel(tr: Trip, t: (k: string) => string): string {
  const phaseKey = tr.phase === "PACK" ? "phase.PACK" : "phase.REVIEW";
  return `${tr.title} · ${t(phaseKey)}`;
}

function CommunityListPage() {
  const { t, lang } = useI18n();
  const { trips, cloneCommunity, library } = usePacklog();
  const [publicTagQ, setPublicTagQ] = useState("");
  const [targetTripId, setTargetTripId] = useState<string>(
    trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]?.id ?? "",
  );

  useEffect(() => {
    if (trips.length === 0) return;
    if (!trips.some((tr) => tr.id === targetTripId)) {
      setTargetTripId(trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]!.id);
    }
  }, [trips, targetTripId]);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind !== "communityClone" || d.tripId !== targetTripId) return;
      const tpl = communityTemplates.find((x) => x.id === d.templateId);
      if (!tpl) return;
      cloneCommunity(d.tripId, tpl, d.selectedIdx, d.targetContainerId);
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [targetTripId, cloneCommunity]);

  const publicTrips = useMemo(() => trips.filter((tr) => tr.isPublic), [trips]);
  const filteredPublicTrips = useMemo(() => {
    const q = publicTagQ.trim().toLowerCase();
    if (!q) return publicTrips;
    return publicTrips.filter(
      (tr) =>
        tr.title.toLowerCase().includes(q) ||
        (tr.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [publicTrips, publicTagQ]);

  return (
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
              className="mt-1 max-w-[min(100%,18rem)] bg-transparent font-mono text-xs focus:outline-none"
            >
              {trips.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {targetTripOptionLabel(tr, t)}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {trips.length > 0 && (
        <section className="module corner-tick p-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-xl">{t("community.public.title")}</h2>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {t("community.public.subtitle")}
              </p>
            </div>
            <label className="block min-w-[200px]">
              <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                {t("community.public.filter")}
              </span>
              <input
                value={publicTagQ}
                onChange={(e) => setPublicTagQ(e.target.value)}
                placeholder={t("community.public.filterPlaceholder")}
                className="w-full rounded border border-border-strong bg-background px-2 py-1.5 font-mono text-xs focus:border-signal focus:outline-none"
              />
            </label>
          </div>
          {filteredPublicTrips.length === 0 ? (
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">
              {publicTrips.length === 0
                ? t("community.public.empty")
                : t("community.public.noMatch")}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPublicTrips.map((tr) => (
                <li key={tr.id}>
                  <Link
                    to="/trip/$tripId"
                    params={{ tripId: tr.id }}
                    className="block rounded-md border border-border-strong bg-surface p-4 transition hover:border-signal hover:bg-surface-2"
                  >
                    <div className="mt-0.5 font-display text-lg leading-tight">{tr.title}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(tr.tags ?? []).map((tag) => (
                        <span key={tag} className="tag-chip">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 inline-block font-mono text-[10px] tracking-[0.18em] text-signal">
                      {t("community.public.open")} →
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div>
        <h2 className="mb-3 font-display text-xl">{t("community.blueprints.title")}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communityTemplates.map((c, i) => {
            const catMatch = libraryCategoryMatchForTemplate(c, library);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to="/community/$templateId"
                  params={{ templateId: c.id }}
                  className="module corner-tick group relative block p-4 text-left transition hover:-translate-y-0.5"
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
                  <div className="mt-2 font-mono text-[10px] text-signal">
                    {t("community.match")}{" "}
                    <span className="tabular-nums text-foreground">
                      {catMatch.matched}/{catMatch.total}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{c.author}</span>
                    <span>
                      {c.items.length} {t("community.items")} · {c.totalWeight}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 inline-block border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground transition group-hover:border-signal group-hover:bg-signal group-hover:text-signal-foreground">
                    {t("community.clone")}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {trips.length === 0 && (
        <div className="module corner-tick p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("archive.empty")}</p>
          <Link
            to="/"
            className="mt-3 inline-block rounded border border-signal bg-signal px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-signal-foreground"
          >
            {t("archive.back")}
          </Link>
        </div>
      )}
    </main>
  );
}
