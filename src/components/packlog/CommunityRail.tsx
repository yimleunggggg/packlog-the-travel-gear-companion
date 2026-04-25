import { motion } from "framer-motion";
import { communityTemplates, type CommunityTemplate, type Trip } from "@/lib/packlog-data";
import { useI18n, pickName } from "@/lib/i18n";

export function CommunityRail({
  scenario,
  onPreview,
}: {
  scenario: Trip["scenario"];
  onPreview: (tpl: CommunityTemplate) => void;
}) {
  const { t, lang } = useI18n();

  // Score: scenario match first, then by rating
  const ranked = [...communityTemplates].sort((a, b) => {
    const aMatch = a.scenario === scenario ? 1 : 0;
    const bMatch = b.scenario === scenario ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return b.rating - a.rating;
  });

  return (
    <section className="module corner-tick relative p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("community.head")}
          </div>
          <h3 className="mt-1 font-display text-lg">{t("community.title")}</h3>
        </div>
        <span className="tag-chip">N={ranked.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {ranked.map((tpl, idx) => {
          const matched = tpl.scenario === scenario;
          return (
            <motion.button
              key={tpl.id}
              onClick={() => onPreview(tpl)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group relative block w-full border border-border bg-surface-2 p-3 text-left transition hover:border-signal hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span>{tpl.author}</span>
                    <span>·</span>
                    <span className="text-signal">★ {tpl.rating}</span>
                    <span>·</span>
                    <span>{tpl.cloned.toLocaleString()} clones</span>
                    {matched && (
                      <span className="ml-1 border border-signal bg-signal px-1.5 py-0.5 text-[9px] tracking-[0.15em] text-signal-foreground">
                        {t("community.matched")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium leading-tight">
                    {lang === "zh" ? (tpl.titleZh ?? tpl.title) : tpl.title}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {tpl.climate} · {t(`scenario.${tpl.scenario}`)}
                  </div>
                </div>
                <div className="ml-2 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  <div>
                    <span className="text-foreground">{tpl.items.length}</span> {t("community.items")}
                  </div>
                  <div>
                    <span className="text-foreground">{tpl.totalWeight}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map((tag) => (
                    <span key={tag} className="tag-chip">#{tag}</span>
                  ))}
                </div>
                <span className="border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground transition group-hover:border-signal group-hover:bg-signal group-hover:text-signal-foreground">
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
