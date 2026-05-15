import type { Item } from "@/lib/packlog-data";

/**
 * G2 分类色块（清单 / 图表 / 社区）。与 `--signal` 铜色系区分，避免与进度条同色块混淆。
 * tech 数码 · apparel 服装 · optic 拍摄 · health 健康 · doc 证件 · misc 其他
 */
export const PACKLOG_CATEGORY_HEX: Record<Item["category"], string> = {
  tech: "#3B82F6",
  apparel: "#b07d4a",
  optic: "#8B5CF6",
  health: "#10B981",
  doc: "#6B7280",
  misc: "#92400E",
};

export function packlogCategoryHex(key: string): string {
  const k = key as Item["category"];
  return PACKLOG_CATEGORY_HEX[k] ?? PACKLOG_CATEGORY_HEX.misc;
}
