import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { CloneSheet } from "@/components/packlog/CloneSheet";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n, pickName } from "@/lib/i18n";
import { communityTemplates, libraryCategoryMatchForTemplate, type Trip } from "@/lib/packlog-data";

function targetTripOptionLabel(tr: Trip, t: (k: string) => string): string {
  const phaseKey = tr.phase === "PACK" ? "phase.PACK" : "phase.REVIEW";
  return `${tr.title} · ${t(phaseKey)}`;
}

export const Route = createFileRoute("/community/$templateId")({
  head: ({ params }) => {
    const tpl = communityTemplates.find((x) => x.id === params.templateId);
    const title = tpl ? `${tpl.title} · PACKLOG` : "Community · PACKLOG";
    const desc = tpl ? tpl.intro.slice(0, 200) : "Community packing blueprint.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        ...(tpl
          ? ([
              { property: "og:title", content: tpl.title },
              { property: "og:description", content: tpl.intro.slice(0, 240) },
              { property: "og:type", content: "article" },
            ] as const)
          : []),
      ],
    };
  },
  component: CommunityTemplateDetailPage,
});

function CommunityTemplateDetailPage() {
  const { templateId } = Route.useParams();
  const { t, lang } = useI18n();
  const { trips, cloneCommunity, library } = usePacklog();
  const tpl = useMemo(
    () => communityTemplates.find((x) => x.id === templateId) ?? null,
    [templateId],
  );
  const [cloneOpen, setCloneOpen] = useState(false);
  const [targetTripId, setTargetTripId] = useState<string>(
    () => trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]?.id ?? "",
  );
  const targetTrip = trips.find((x) => x.id === targetTripId);

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
      const found = communityTemplates.find((x) => x.id === d.templateId);
      if (!found) return;
      cloneCommunity(d.tripId, found, d.selectedIdx, d.targetContainerId);
      setCloneOpen(false);
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [targetTripId, cloneCommunity]);

  const catMatch = tpl ? libraryCategoryMatchForTemplate(tpl, library) : null;

  if (!tpl) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("community.detail.notFound")}</p>
        <Link
          to="/community"
          className="mt-6 inline-block rounded border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground"
        >
          {t("community.detail.back")}
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Link
            to="/community"
            className="font-mono text-[10px] tracking-[0.2em] text-signal hover:underline"
          >
            {t("community.detail.back")}
          </Link>
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
        </div>

        <header className="module corner-tick p-5">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("community.head")}
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight md:text-4xl">
            {lang === "zh" ? (tpl.titleZh ?? tpl.title) : tpl.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
            <span>{t(`scenario.${tpl.scenario}`)}</span>
            <span>{tpl.climate}</span>
            <span>{tpl.totalWeight}</span>
            <span>★ {tpl.rating}</span>
          </div>
          {catMatch ? (
            <p className="mt-3 font-mono text-[10px] text-signal">
              {t("community.match")}{" "}
              <span className="tabular-nums text-foreground">
                {catMatch.matched}/{catMatch.total}
              </span>
            </p>
          ) : null}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {lang === "zh" ? (tpl.introZh ?? tpl.intro) : tpl.intro}
          </p>
          {trips.length === 0 ? (
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">{t("archive.empty")}</p>
          ) : (
            <button
              type="button"
              onClick={() => setCloneOpen(true)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-signal bg-signal px-5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.2em] text-signal-foreground shadow-sm transition hover:opacity-95"
            >
              {t("community.detail.openClone")}
            </button>
          )}
        </header>

        <section className="module corner-tick p-5">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("community.merge.itemsSection")}
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {tpl.items.map((it, i) => (
              <li
                key={`${it.name}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2.5"
              >
                <span className="min-w-0 flex-1 text-sm font-medium">{pickName(lang, it)}</span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  ×{it.qty} · {it.weightG}g · {t(`cat.${it.category}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <CloneSheet
        template={cloneOpen ? tpl : null}
        containers={targetTrip?.containers ?? []}
        library={library}
        targetTripId={targetTrip?.id ?? ""}
        onClose={() => setCloneOpen(false)}
        onCommit={(idx, target) => {
          if (targetTrip) cloneCommunity(targetTrip.id, tpl, idx, target);
          setCloneOpen(false);
        }}
      />
    </>
  );
}
