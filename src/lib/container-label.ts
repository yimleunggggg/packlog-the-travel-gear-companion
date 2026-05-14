import type { Container } from "@/lib/packlog-data";
import type { Lang } from "@/lib/i18n";

/** Human bag label: custom name, else localized preset type. */
export function containerDisplayLabel(
  c: Container,
  lang: Lang,
  t: (key: string) => string,
): string {
  if (c.type === "custom") {
    return lang === "zh" ? (c.nameZh ?? c.name) : c.name;
  }
  return t(`container.type.${c.type}`);
}
