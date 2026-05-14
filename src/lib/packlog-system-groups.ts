/**
 * PACKLOG-SPEC §2.4 — 场景驱动的「系统分组」映射层（底层 `Item.category` 不变）。
 * 推断逻辑仅依赖名称/可选 `systemGroup` 字段，便于日后与 Supabase `trip_items.system_group` 对齐。
 */

import type { Item, PackSystemGroup, Trip } from "@/lib/packlog-data";
import type { ScenarioKey } from "@/lib/scenario-templates";
import { tripScenarios } from "@/lib/trip-scenarios";

export type { PackSystemGroup };

/** 图表 / 列表排序用：不含 `uncategorized`（末尾单独处理）。 */
export const PACK_SYSTEM_GROUP_ORDER: readonly PackSystemGroup[] = [
  "shelter",
  "sleep_system",
  "cooking",
  "nav_safety",
  "movement",
  "main_pack",
  "resupply",
  "apparel_layer",
];

/** SPEC Big3：庇护、睡眠、主包 — 用系统分组近似 */
export const BIG3_SYSTEM_GROUPS: readonly PackSystemGroup[] = [
  "shelter",
  "sleep_system",
  "main_pack",
];

/** 条形图 / 图例颜色（与 `cat.*` 区分，便于户外系统视图一眼辨认）。 */
export const SYSTEM_GROUP_CHART_COLOR: Record<PackSystemGroup, string> = {
  shelter: "var(--signal)",
  sleep_system: "var(--info)",
  cooking: "var(--warn)",
  nav_safety: "var(--success)",
  movement: "var(--signal)",
  main_pack: "var(--foreground)",
  resupply: "var(--muted-foreground)",
  apparel_layer: "var(--signal)",
  uncategorized: "var(--muted-foreground)",
};

/** 出现任一此类场景时，重量分布 UI 可切换为「系统分组」视角。 */
export const OUTDOOR_PACK_SCENARIOS: readonly ScenarioKey[] = [
  "trail-run",
  "alpine",
  "ski",
  "dive",
  "desert",
];

const KEYWORDS: Record<PackSystemGroup, readonly string[]> = {
  shelter: ["tent", "tarptent", "tarp", "shelter", "帐", "帐篷", "天幕", "庇护"],
  sleep_system: [
    "sleep",
    "sleeping bag",
    "quilt",
    "pad",
    "mat",
    "bivy",
    "睡袋",
    "睡垫",
    "充气垫",
    "蛋巢",
    "枕头",
  ],
  cooking: ["stove", "pot", "fuel", "canister", "炉", "气罐", "锅", "餐具", "挡风"],
  nav_safety: [
    "gps",
    "headlamp",
    "first aid",
    "whistle",
    "beacon",
    "compass",
    "map",
    "头灯",
    "急救",
    "指南针",
    "地图",
  ],
  movement: ["pole", "trekking", "杖", "登山杖", "gaiter", "雪套"],
  main_pack: [
    "backpack",
    "pack ",
    " rucksack",
    "osprey",
    "gregory",
    "ula",
    "hyperlite",
    "背包",
    "登山包",
    "越野包",
  ],
  resupply: ["water", "food", "gel", "electrolyte", "水", "食物", "能量胶", "盐丸", "电解质"],
  apparel_layer: [
    "shell",
    "jacket",
    "down",
    "fleece",
    "rain",
    "硬壳",
    "软壳",
    "羽绒",
    "抓绒",
    "冲锋",
    "雨衣",
    "gore-tex",
    "gtx",
  ],
  uncategorized: [],
};

function itemHaystack(it: Item): string {
  const parts = [it.name, it.nameEn, it.nameZh, it.brand, it.model].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

/** 显式字段优先，否则按关键词启发式推断。 */
export function effectiveSystemGroup(it: Item): PackSystemGroup {
  if (it.systemGroup) return it.systemGroup;
  const hay = itemHaystack(it);
  const order: PackSystemGroup[] = [
    "shelter",
    "sleep_system",
    "cooking",
    "nav_safety",
    "movement",
    "main_pack",
    "resupply",
    "apparel_layer",
  ];
  for (const g of order) {
    for (const kw of KEYWORDS[g]) {
      if (hay.includes(kw.toLowerCase())) return g;
    }
  }
  if (it.category === "apparel") return "apparel_layer";
  return "uncategorized";
}

export function tripUsesOutdoorSystemView(trip: Trip): boolean {
  const tags = tripScenarios(trip);
  return tags.some((s) => OUTDOOR_PACK_SCENARIOS.includes(s));
}

export function isBig3Group(g: PackSystemGroup): boolean {
  return (BIG3_SYSTEM_GROUPS as readonly PackSystemGroup[]).includes(g);
}
