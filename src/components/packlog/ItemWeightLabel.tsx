import type { Item } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";
import { formatItemWeightLine, itemWeightDisplayClasses } from "@/lib/weight-provenance";

export function ItemWeightLabel({ item, className = "" }: { item: Item; className?: string }) {
  const { t } = useI18n();
  const line = formatItemWeightLine(item);
  const tierCls = itemWeightDisplayClasses(item.weightSource);
  const range =
    item.weightSource === "ai_estimate" &&
    item.weightEstimateLowG != null &&
    item.weightEstimateHighG != null ? (
      <span className="text-[9px] text-muted-foreground">
        {" "}
        ({item.weightEstimateLowG}–{item.weightEstimateHighG})
      </span>
    ) : null;
  const nBadge =
    item.weightSource === "community_median" && item.communityMedianSampleCount ? (
      <span className="ml-0.5 text-[9px] text-muted-foreground" title={t("weight.tier.community")}>
        n={item.communityMedianSampleCount}
      </span>
    ) : null;

  const title =
    item.weightSource === "ai_estimate"
      ? t("weight.tier.ai")
      : item.weightSource === "community_median"
        ? t("weight.tier.community")
        : item.weightSource === "user"
          ? t("weight.tier.user")
          : "";

  return (
    <span className={`font-mono text-[11px] tabular-nums ${tierCls} ${className}`} title={title}>
      {line.prefixTilde ? "~" : ""}
      {line.text}
      {range}
      {nBadge}
      {item.weightSource === "user" && (
        <span className="ml-0.5 text-signal" aria-hidden>
          ·
        </span>
      )}
    </span>
  );
}
