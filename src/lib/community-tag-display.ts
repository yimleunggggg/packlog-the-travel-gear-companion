import type { Lang } from "@/lib/i18n";
import { formatTagForUi } from "@/lib/tag-presets";

/** 过滤疑似损坏的单字符标签（如 #C）。 */
export function filterTripTagList(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  return tags.filter((raw) => {
    const k = raw.replace(/^#/, "").trim().toLowerCase();
    if (k.length <= 1) return false;
    return true;
  });
}

export function formatCommunityTag(raw: string, lang: Lang): string {
  const k = raw.replace(/^#/, "").trim();
  const label = formatTagForUi(k, lang);
  return `#${label}`;
}
