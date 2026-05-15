import type { Trip } from "@/lib/packlog-data";
import type { Lang } from "@/lib/i18n";

/** 去掉内部编号 TRP-xxxx 的展示（终审 2.7）。 */
export function stripInternalTripRef(title: string): string {
  return title
    .replace(/\bTRP-\d{2,6}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[\u00B7\u30FB·•]\s*[\u00B7\u30FB·•]\s*/g, " · ")
    .replace(/^\s*[\u00B7\u30FB·•]\s*/g, "")
    .replace(/\s*[\u00B7\u30FB·•]\s*$/g, "")
    .trim();
}

/** 折叠重复的「· 5天 · 5天」「・5日・5日」等（仅合并相同数字；终审 2.2）。 */
export function normalizeTripTitleDisplay(title: string): string {
  let s = title.trim();
  // Unify middle-dot variants so "张家界·5天" 与 "张家界・5天" 等规则一致。
  s = s.replace(/[\u00B7\u30FB•]/g, "·");

  let prev = "";
  while (s !== prev) {
    prev = s;
    // Same day count repeated: ·5天·5天 → ·5天（允许 5 与 5 之间有空格）
    s = s.replace(/(·\s*)(\d+)\s*天(\s*·\s*\2\s*天)+/g, "$1$2天");
    s = s.replace(/(·\s*)(\d+)\s*日(\s*·\s*\2\s*日)+/g, "$1$2日");
    s = s.replace(/(·\s*)(\d+)\s*d(\s*·\s*\2\s*d)+/gi, "$1$2d");
    s = s.replace(/(·\s*)(\d+)\s+days(\s*·\s*\2\s+days)+/gi, "$1$2 days");
  }
  return s.trim();
}

function tripPlacesDotSeparated(tr: Trip, lang: Lang): string {
  if (!tr.destinations?.length) return "";
  return tr.destinations.map((d) => (lang === "zh" ? d.cityZh : d.cityEn)).join("·");
}

function dayTokenCompact(tr: Trip, lang: Lang): string {
  if (tr.days <= 0) return "";
  if (lang === "zh") return `${tr.days}天`;
  if (lang === "ja") return `${tr.days}日`;
  return `${tr.days}d`;
}

/**
 * 卡片 / 页眉 / 下拉等展示用行程标题：有目的地时仅「城市·城市·天数」，不拼接场景、阶段；
 * 否则回退到清洗后的 `trip.title`（无 TRP、无重复天数片段）。
 */
export function tripTitleDisplay(tr: Trip, lang: Lang): string {
  const places = tripPlacesDotSeparated(tr, lang);
  if (places) {
    const day = dayTokenCompact(tr, lang);
    return day ? `${places}·${day}` : places;
  }
  const cleaned = normalizeTripTitleDisplay(stripInternalTripRef(tr.title));
  if (cleaned) return cleaned;
  const fallback = stripInternalTripRef(tr.title).trim();
  return fallback || tr.id;
}

/** 下拉 / 选择器：与 `tripTitleDisplay` 一致（不拼场景、阶段）。 */
export function tripShortSelectLabel(tr: Trip, lang: Lang): string {
  return tripTitleDisplay(tr, lang);
}
