import { motion } from "framer-motion";
import { communityTemplates } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";

export function CommunityRail({ onClone }: { onClone: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <section className="module corner-tick relative p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("community.head")}
          </div>
          <h3 className="mt-1 font-display text-lg">{t("community.title")}</h3>
        </div>
        <span className="tag-chip">N={communityTemplates.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {communityTemplates.map((tpl, idx) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="group relative border border-border bg-surface-2 p-3 transition hover:border-signal"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                  <span>{tpl.author}</span>
                  <span>·</span>
                  <span className="text-signal">★ {tpl.rating}</span>
                  <span>·</span>
                  <span>{tpl.cloned.toLocaleString()} clones</span>
                </div>
                <div className="mt-1 text-sm font-medium leading-tight">
                  {tpl.title}
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {tpl.climate}
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-muted-foreground">
                <div>
                  <span className="text-foreground">{tpl.items}</span> {t("community.items")}
                </div>
                <div>
                  <span className="text-foreground">{tpl.weight}</span>
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
              <button
                onClick={() => onClone(tpl.id)}
                className="border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground transition hover:bg-signal hover:text-signal-foreground"
              >
                {t("community.clone")}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
