import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { CommunityUrlImport } from "@/components/packlog/CommunityUrlImport";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { communityTemplates, isCommunityGuide, libraryCategoryMatchForTemplate } from "@/lib/packlog-data";
import { motion } from "framer-motion";
import { filterTripTagList, formatCommunityTag } from "@/lib/community-tag-display";
import { canonicalTagKey, isPresetTagId, tagListIncludesFilter } from "@/lib/tag-presets";
import {
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogBtnSm,
  packlogBtnTertiary,
  packlogCardMono,
  packlogFieldLabel,
  packlogHint,
  packlogItemName,
  packlogKicker,
  packlogPageTitle,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community/")({
  validateSearch: (search: Record<string, unknown>) => ({
    tag: typeof search.tag === "string" && search.tag.trim() ? search.tag.trim() : undefined,
    kind:
      search.kind === "blueprint" || search.kind === "guide"
        ? (search.kind as "blueprint" | "guide")
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Community Kits · PACKLOG" },
      {
        name: "description",
        content:
          "Reference packing kits from the community — copy any blueprint into your trip.",
      },
    ],
  }),
  component: CommunityListPage,
});

function CommunityListPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { tag: tagFilter, kind: kindRaw } = Route.useSearch();
  const kind = kindRaw ?? "all";
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
      cloneCommunity(d.tripId, tpl, d.selectedIdx, d.targetContainerId, d.ownership);
      const n = d.selectedIdx.length;
      if (n > 0) {
        toast.success(t("community.merge.successToast").replace("{n}", String(n)));
      }
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [targetTripId, cloneCommunity, t]);

  const publicTrips = useMemo(() => trips.filter((tr) => tr.isPublic), [trips]);
  const filteredPublicTrips = useMemo(() => {
    const q = publicTagQ.trim().toLowerCase();
    return publicTrips.filter((tr) => {
      if (tagFilter && !tagListIncludesFilter(tr.tags, tagFilter)) return false;
      if (!q) return true;
      const titleOk = tr.title.toLowerCase().includes(q);
      const tagOk = (tr.tags ?? []).some((tt) => {
        const raw = tt.toLowerCase();
        return raw.includes(q) || formatCommunityTag(tt, lang).toLowerCase().includes(q);
      });
      return titleOk || tagOk;
    });
  }, [publicTrips, publicTagQ, tagFilter, lang]);

  const filteredTemplates = useMemo(() => {
    let list = communityTemplates;
    if (kind === "blueprint") list = list.filter((c) => !isCommunityGuide(c));
    else if (kind === "guide") list = list.filter((c) => isCommunityGuide(c));
    if (!tagFilter?.trim()) return list;
    return list.filter((c) => tagListIncludesFilter(c.tags, tagFilter));
  }, [tagFilter, kind]);

  return (
    <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
      {trips.length > 0 ? (
        <CommunityUrlImport
          trips={trips}
          targetTripId={targetTripId}
          onTargetTripChange={setTargetTripId}
        />
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
            {t("community.head")}
          </div>
          <h1 className={cn("mt-2", packlogPageTitle)}>{t("community.title")}</h1>
          <p className={cn("mt-2 max-w-md", packlogHint)}>{t("community.pageSubtitle")}</p>
        </div>
      </header>

      {tagFilter ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-3 py-2 font-mono text-[10px] text-muted-foreground">
          <span>
            {t("tag.filter.active")}:{" "}
            <span className="text-foreground">{formatCommunityTag(tagFilter, lang)}</span>
          </span>
          <Link
            to="/community"
            search={{ tag: undefined, kind: kind === "all" ? undefined : kind }}
            className={cn(packlogBtnTertiary, packlogBtnSm, "min-h-0 px-2 py-1")}
          >
            {t("tag.filter.clear")}
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-md border border-border-strong bg-surface-2/60 p-1.5 font-mono text-[10px]">
        <Link
          to="/community"
          search={{ tag: tagFilter, kind: undefined }}
          className={cn(
            "rounded px-2.5 py-1.5 transition",
            kind === "all"
              ? "bg-signal text-signal-foreground"
              : "text-muted-foreground hover:bg-surface hover:text-foreground",
          )}
        >
          {t("community.kind.all")}
        </Link>
        <Link
          to="/community"
          search={{ tag: tagFilter, kind: "blueprint" }}
          className={cn(
            "rounded px-2.5 py-1.5 transition",
            kind === "blueprint"
              ? "bg-signal text-signal-foreground"
              : "text-muted-foreground hover:bg-surface hover:text-foreground",
          )}
        >
          {t("community.kind.blueprints")}
        </Link>
        <Link
          to="/community"
          search={{ tag: tagFilter, kind: "guide" }}
          className={cn(
            "rounded px-2.5 py-1.5 transition",
            kind === "guide"
              ? "bg-signal text-signal-foreground"
              : "text-muted-foreground hover:bg-surface hover:text-foreground",
          )}
        >
          {t("community.kind.guides")}
        </Link>
      </div>

      {trips.length > 0 && (
        <section className="module corner-tick p-5">
          <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-6">
            <div className="min-w-0">
              <h2 className={packlogSectionTitle}>{t("community.public.title")}</h2>
              <p className={cn(packlogHint, "mt-2 max-w-prose text-muted-foreground")}>
                {t("community.public.subtitle")}
              </p>
            </div>
            <label className="block w-full min-w-0 md:max-w-sm md:shrink-0">
              <span className={packlogFieldLabel}>{t("community.public.filter")}</span>
              <input
                value={publicTagQ}
                onChange={(e) => setPublicTagQ(e.target.value)}
                placeholder={t("community.public.filterPlaceholder")}
                type="search"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="mt-1 min-h-11 w-full rounded-md border border-border-strong bg-background px-3 py-2.5 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-foreground/35 focus:outline-none md:min-h-0 md:py-2 md:text-sm"
              />
            </label>
          </div>
          {filteredPublicTrips.length === 0 ? (
            <p className={cn(packlogHint, "mt-4 text-muted-foreground")}>
              {publicTrips.length === 0
                ? t("community.public.empty")
                : t("community.public.noMatch")}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPublicTrips.map((tr) => (
                <li key={tr.id}>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate({
                        to: tr.phase === "PACK" ? "/trip/$tripId/pack" : "/trip/$tripId",
                        params: { tripId: tr.id },
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate({
                          to: tr.phase === "PACK" ? "/trip/$tripId/pack" : "/trip/$tripId",
                          params: { tripId: tr.id },
                        });
                      }
                    }}
                    className="module block cursor-pointer p-4 text-left transition-shadow hover:shadow-md"
                  >
                    <div className="mt-0.5 font-display text-lg leading-tight">{tripTitleDisplay(tr, lang)}</div>
                    <div
                      className="mt-2 flex flex-wrap gap-1"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      {filterTripTagList(tr.tags).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/community",
                              search: {
                                tag: canonicalTagKey(tag),
                                kind: kind === "all" ? undefined : kind,
                              },
                            })
                          }
                          className={cn(
                            "tag-chip cursor-pointer transition hover:border-foreground/25 hover:text-foreground",
                            !isPresetTagId(tag) &&
                              "border-dashed border-muted-foreground/70 bg-transparent",
                          )}
                        >
                          {formatCommunityTag(tag, lang)}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 inline-block font-mono text-[10px] tracking-[0.18em] text-[#6B5234]">
                      {t("community.public.open")} →
                    </div>
                  </motion.div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div>
        <h2 className={cn("mb-3", packlogSectionTitle)}>{t("community.blueprints.title")}</h2>
        {filteredTemplates.length === 0 && (tagFilter || kind !== "all") ? (
          <p className={cn(packlogHint, "mb-3")}>{t("community.kind.empty")}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((c, i) => {
            const catMatch = libraryCategoryMatchForTemplate(c, library);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate({ to: "/community/$templateId", params: { templateId: c.id } })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ to: "/community/$templateId", params: { templateId: c.id } });
                  }
                }}
                className="module corner-tick group relative block cursor-pointer p-4 text-left transition-shadow hover:shadow-md"
              >
                <div className={packlogKicker}>
                  {isCommunityGuide(c) ? t("community.badge.guide") : t("community.badge.blueprint")} ·{" "}
                  {t(`scenario.${c.scenario}`)} · ★ {c.rating}
                </div>
                <h3 className={cn("font-display mt-1", packlogItemName)}>
                  {lang === "zh" ? (c.titleZh ?? c.title) : c.title}
                </h3>
                <p className={cn(packlogHint, "mt-2 line-clamp-2 text-pretty")}>
                  {lang === "zh" ? (c.introZh ?? c.intro) : c.intro}
                </p>
                <div className={cn(packlogCardMono, "mt-2")}>
                  {t("community.match")}{" "}
                  <span className="tabular-nums text-foreground">
                    {catMatch.matched}/{catMatch.total}
                  </span>
                </div>
                <div className={cn(packlogCardMono, "mt-3 flex items-center justify-between")}>
                  <span>{c.author}</span>
                  <span>
                    {isCommunityGuide(c) && c.items.length === 0
                      ? t("community.card.guideDocOnly")
                      : `${c.items.length} ${t("community.items")} · ${lang === "zh" && c.totalWeightZh ? c.totalWeightZh : c.totalWeight}`}
                  </span>
                </div>
                <div
                  className="mt-2 flex flex-wrap gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  {c.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/community",
                          search: { tag: canonicalTagKey(tag), kind: kind === "all" ? undefined : kind },
                        })
                      }
                      className={cn(
                        "tag-chip cursor-pointer transition hover:border-foreground/25 hover:text-foreground",
                        !isPresetTagId(tag) && "border-dashed border-muted-foreground/70 bg-transparent",
                      )}
                    >
                      {formatCommunityTag(tag, lang)}
                    </button>
                  ))}
                </div>
                <span
                  className={cn(
                    packlogBtnSecondary,
                    packlogBtnSm,
                    "mt-3 inline-flex pointer-events-none",
                  )}
                >
                  {t("community.clone")}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {trips.length === 0 && (
        <div className="module corner-tick p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("archive.empty")}</p>
          <Link to="/" search={{ tag: undefined }} className={cn(packlogBtnPrimary, packlogBtnSm, "mt-3 inline-flex")}>
            {t("archive.back")}
          </Link>
        </div>
      )}
    </main>
  );
}
