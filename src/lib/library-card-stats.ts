import type { Lang } from "@/lib/i18n";

export function formatLibraryGearCardStats(
  lang: Lang,
  tripTouchCount: number,
  vc: { keep: number; upgrade: number; drop: number },
): string {
  if (lang === "zh") {
    const parts: string[] = [];
    parts.push(`用过 ${tripTouchCount} 次`);
    parts.push(`保留 ${vc.keep}`);
    if (vc.upgrade > 0) parts.push(`升级 ${vc.upgrade}`);
    if (vc.drop > 0) parts.push(`淘汰 ${vc.drop}`);
    return parts.join(" · ");
  }
  if (lang === "ja") {
    const parts: string[] = [];
    parts.push(`${tripTouchCount} 旅程で使用`);
    parts.push(`また使う ${vc.keep}`);
    if (vc.upgrade > 0) parts.push(`アップグレード ${vc.upgrade}`);
    if (vc.drop > 0) parts.push(`いらなかった ${vc.drop}`);
    return parts.join(" · ");
  }
  const parts: string[] = [];
  parts.push(`${tripTouchCount} trip${tripTouchCount === 1 ? "" : "s"}`);
  parts.push(`keep ${vc.keep}`);
  if (vc.upgrade > 0) parts.push(`upgrade ${vc.upgrade}`);
  if (vc.drop > 0) parts.push(`drop ${vc.drop}`);
  return parts.join(" · ");
}
