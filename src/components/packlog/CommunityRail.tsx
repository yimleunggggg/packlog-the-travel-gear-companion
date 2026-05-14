import { motion } from "framer-motion";
import {
  communityTemplates,
  libraryCategoryMatchForTemplate,
  type CommunityTemplate,
  type Trip,
} from "@/lib/packlog-data";
import type { ScenarioKey } from "@/lib/scenario-templates";
import { tripMatchesTemplateScenario, tripScenarios } from "@/lib/trip-scenarios";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";

export function CommunityRail({
  trip,
  scenarios,
  onPreview,
}: {
  trip?: Trip;
  scenarios?: ScenarioKey[];
  onPreview: (tpl: CommunityTemplate) => void;
}) {
  const { t, lang } = useI18n();
  const { library } = usePacklog();

  const scenarioTags = trip ? tripScenarios(trip) : (scenarios ?? []);

  // Score: any scenario match first, then by rating
  const ranked = [...communityTemplates].sort((a, b) => {
    const aMatch = tripMatchesTemplateScenario(scenarioTags, a.scenario) ? 1 : 0;
    const bMatch = tripMatchesTemplateScenario(scenarioTags, b.scenario) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return b.rating - a.rating;
  });

  return (
    <section className="module corner-tick relative p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
            {t("community.head")}
          </div>
          <h3 className="mt-1 font-display text-lg">{t("community.title")}</h3>
        </div>
        <span className="tag-chip">N={ranked.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {ranked.map((tpl, idx) => {
          const matched = tripMatchesTemplateScenario(scenarioTags, tpl.scenario);
          const catMatch = libraryCategoryMatchForTemplate(tpl, library);
          return (
            <motion.button
              key={tpl.id}
              onClick={() => onPreview(tpl)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group relative block w-full border border-border bg-surface-2 p-3 text-left transition hover:border-border-strong hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span>{tpl.author}</span>
                    <span>·</span>
                    <span className="tabular-nums text-foreground">★ {tpl.rating}</span>
                    <span>·</span>
                    <span>{tpl.cloned.toLocaleString()} clones</span>
                    {matched && (
                      <span className="ml-1 rounded border border-border-strong bg-surface px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-foreground">
                        {t("community.matched")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium leading-tight">
                    {lang === "zh" ? (tpl.titleZh ?? tpl.title) : tpl.title}
                  </div>
                  {tpl.sourceUrl ? (
                    <a
                      href={tpl.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-block max-w-full truncate font-mono text-[9px] text-link underline decoration-border-strong underline-offset-2 hover:decoration-foreground"
                    >
                      {lang === "zh"
                        ? `出处 · ${tpl.sourceTitle ?? tpl.sourceUrl}`
                        : `Source · ${tpl.sourceTitle ?? tpl.sourceUrl}`}
                    </a>
                  ) : null}
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {tpl.climate} · {t(`scenario.${tpl.scenario}`)}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {t("community.match")}{" "}
                    <span className="tabular-nums text-foreground">
                      {catMatch.matched}/{catMatch.total}
                    </span>
                  </div>
                </div>
                <div className="ml-2 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  <div>
                    <span className="text-foreground">{tpl.items.length}</span>{" "}
                    {t("community.items")}
                  </div>
                  <div>
                    <span className="text-foreground">{tpl.totalWeight}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground transition group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
                  {t("community.clone")}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
