/**
 * PACKLOG-SPEC §2.4 — 场景驱动的「系统分组」映射层（底层 `Item.category` 不变）。
 * 推断逻辑仅依赖名称/可选 `systemGroup` 字段，便于日后与 Supabase `trip_items.system_group` 对齐。
 */

import type { Item, PackSystemGroup, Trip } from "@/lib/packlog-data";
import type { ScenarioKey } from "@/lib/scenario-templates";
import {
  OUTDOOR_SCENARIO_KEYS_LIST,
  tripScenariosIncludeOutdoorPacking,
} from "@/lib/outdoor-packing-scenarios";

export type { PackSystemGroup };

/** 图表 / 列表排序用：不含 `uncategorized`（末尾单独处理）。 */
export const PACK_SYSTEM_GROUP_ORDER: readonly PackSystemGroup[] = [
  "shelter",
  "sleep_system",
  "cooking",
  "nav_safety",
  "main_pack",
  "movement",
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

/** @deprecated 与 `outdoor-packing-scenarios` 同步；请优先使用 `OUTDOOR_SCENARIO_KEYS_LIST`。 */
export const OUTDOOR_PACK_SCENARIOS: readonly ScenarioKey[] = OUTDOOR_SCENARIO_KEYS_LIST;

const KEYWORDS: Record<PackSystemGroup, readonly string[]> = {
  shelter: [
    "tent",
    "tarptent",
    "tarp",
    "shelter",
    "帐",
    "帐篷",
    "天幕",
    "庇护",
    "内外帐",
    "hammock",
    "吊床",
  ],
  sleep_system: [
    "sleeping bag",
    "sleeping pad",
    "sleeping mat",
    "quilt",
    "bivy",
    "睡袋",
    "睡垫",
    "充气垫",
    "防潮垫",
    "蛋巢",
    "枕头",
    "充气枕",
    "pillow",
    "地布",
    "防潮布",
    "groundsheet",
    "footprint",
    "r值",
    "温标",
  ],
  cooking: [
    "stove",
    "canister",
    "fuel",
    "cookset",
    "炉头",
    "炉具",
    "炉",
    "气罐",
    "扁气罐",
    "燃料",
    "挡风",
    "钛杯",
    "餐具",
    "套锅",
    "钛锅",
    "雪拉碗",
    "spork",
    "mug",
  ],
  nav_safety: [
    "gps",
    "inreach",
    "plb",
    "beacon",
    "compass",
    "map",
    "headlamp",
    "first aid",
    "whistle",
    "地图",
    "指南针",
    "头灯",
    "急救",
    "求生",
    "哨子",
    "卫星",
    "导航",
  ],
  main_pack: [
    "backpack",
    "rucksack",
    "daypack",
    "hydration",
    "osprey",
    "gregory",
    "ula",
    "hyperlite",
    "背包",
    "登山包",
    "越野包",
    "双肩包",
    "攻顶包",
    "水袋包",
    "trail vest",
    "vest 12",
    "vest 5",
    "pack 12",
    "pack 18",
  ],
  movement: [
    "pole",
    "trekking",
    "登山杖",
    "越野杖",
    "折叠杖",
    "手杖",
    "杖",
    "gaiter",
    "雪套",
    "crampon",
    "冰爪",
    "micro spike",
  ],
  resupply: [
    "water",
    "food",
    "gel",
    "electrolyte",
    "filter",
    "purifier",
    "水",
    "食物",
    "能量胶",
    "盐丸",
    "电解质",
    "补给",
    "净水",
    "路餐",
  ],
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
    "baselayer",
    "base layer",
    "mid layer",
    "merino",
    "打底",
    "保暖",
    "中层",
    "速干",
    "裤",
    "袜",
    "帽",
    "手套",
    "鞋",
    "靴",
    "boot",
    "sneaker",
    "跑鞋",
    "凉鞋",
    "拖鞋",
    "trail runner",
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
    "main_pack",
    "movement",
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
  return tripScenariosIncludeOutdoorPacking(trip);
}

export function isBig3Group(g: PackSystemGroup): boolean {
  return (BIG3_SYSTEM_GROUPS as readonly PackSystemGroup[]).includes(g);
}
