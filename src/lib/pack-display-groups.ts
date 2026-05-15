import type { Item, Trip } from "@/lib/packlog-data";
import { tripScenariosIncludeOutdoorPacking } from "@/lib/outdoor-packing-scenarios";

export type OutdoorDisplayGroup = "sleep" | "wear" | "cook" | "nav" | "move" | "resupply" | "other";

export type UrbanDisplayGroup = "apparel" | "footwear" | "tech" | "health" | "doc" | "misc";

export type PackDisplayGroup = OutdoorDisplayGroup | UrbanDisplayGroup;

const OUTDOOR_ORDER: OutdoorDisplayGroup[] = [
  "sleep",
  "wear",
  "cook",
  "nav",
  "move",
  "resupply",
  "other",
];

const URBAN_ORDER: UrbanDisplayGroup[] = ["apparel", "footwear", "tech", "health", "doc", "misc"];

/** 条形图 / 圆点 — 户外与清单分组一致。 */
export const PACK_DISPLAY_GROUP_CHART_COLOR: Record<PackDisplayGroup, string> = {
  sleep: "var(--info)",
  wear: "var(--signal)",
  cook: "var(--warn)",
  nav: "var(--success)",
  move: "var(--foreground)",
  resupply: "var(--muted-foreground)",
  other: "var(--muted-foreground)",
  apparel: "#3B82F6",
  footwear: "#92400E",
  tech: "#3B82F6",
  health: "#10B981",
  doc: "#6B7280",
  misc: "#92400E",
};

type KeywordRule = { re: RegExp; g: OutdoorDisplayGroup };

/**
 * 顺序敏感：先匹配睡眠/炊事/导航，再匹配背包杖类「行进」，最后才是泛穿着与补给。
 */
const OUTDOOR_KEYWORD_RULES: KeywordRule[] = [
  {
    re: /帐篷|天幕|内外帐|庇护所|睡袋|睡垫|充气垫|防潮垫|蛋巢|r值|温标|枕头|充气枕|地布|防潮布|groundsheet|footprint|tent|sleeping\s*bag|sleeping\s*pad|quilt|bivy|吊床|hammock|tarp|tarptent/i,
    g: "sleep",
  },
  {
    re: /炉头|炉具|炉|气罐|燃料|扁气罐|挡风|钛杯|餐具|套锅|雪拉碗|spork|cookset|stove|canister|fuel|pot(?!ato)|mug|cup(?!board)/i,
    g: "cook",
  },
  {
    re: /gps|卫星|inreach|plb|地图|指南针|头灯|求生|哨子|急救|绷带|消毒|导航|compass|beacon|map|headlamp|first\s*aid|whistle/i,
    g: "nav",
  },
  {
    re: /登山杖|越野杖|折叠杖|手杖|杖|pole|trekking|gaiter|雪套|冰爪|crampon|micro\s*spike|背包|登山包|越野包|双肩包|攻顶包|水袋包|hydration|daypack|backpack|rucksack|trail\s*vest|vest\s*\d|osprey|gregory|ula|hyperlite/i,
    g: "move",
  },
  {
    re: /冲锋衣|硬壳|软壳|羽绒|抓绒|打底|保暖|中层|美利奴|速干|base\s*layer|mid\s*layer|雨衣|裤|袜|帽|冷帽|线帽|手套|袖套|gore|down|fleece|shell|jacket|pants|socks|gloves|merino|hoodie|鞋|靴|boot|sneaker|跑鞋|凉鞋|拖鞋|trail\s*runner/i,
    g: "wear",
  },
  {
    re: /水|壶|食物|路餐|能量|盐丸|电解质|补给|净水|filter|purifier|water|food|gel|electrolyte|snack|meal/i,
    g: "resupply",
  },
];

function defaultOutdoorFromCategory(c: Item["category"]): OutdoorDisplayGroup {
  switch (c) {
    case "doc":
      return "nav";
    case "health":
      return "resupply";
    case "tech":
      return "other";
    case "optic":
      return "move";
    case "apparel":
      return "wear";
    default:
      return "other";
  }
}

function isFootwearName(name: string): boolean {
  return /鞋|靴|boot|sneaker|跑鞋|凉鞋|拖鞋|footwear|trail\s*shoe/i.test(name);
}

/** True → 清单 + 重量分布使用户外系统分组（与 `outdoor-packing-scenarios` 一致）。 */
export function tripUsesOutdoorPackGrouping(trip: Trip): boolean {
  return tripScenariosIncludeOutdoorPacking(trip);
}

export function outdoorGroupForItem(
  item: Pick<Item, "category" | "name" | "nameEn" | "nameZh">,
): OutdoorDisplayGroup {
  const blob = [item.name, item.nameEn ?? "", item.nameZh ?? ""].join(" ");
  for (const { re, g } of OUTDOOR_KEYWORD_RULES) {
    if (re.test(blob)) return g;
  }
  return defaultOutdoorFromCategory(item.category);
}

export function urbanGroupForItem(
  item: Pick<Item, "category" | "name" | "nameEn" | "nameZh">,
): UrbanDisplayGroup {
  const blob = [item.name, item.nameEn ?? "", item.nameZh ?? ""].join(" ");
  if (isFootwearName(blob)) return "footwear";
  switch (item.category) {
    case "apparel":
      return "apparel";
    case "tech":
    case "optic":
      return "tech";
    case "health":
      return "health";
    case "doc":
      return "doc";
    default:
      return "misc";
  }
}

export function packGroupOrder(trip: Trip): PackDisplayGroup[] {
  return tripUsesOutdoorPackGrouping(trip) ? [...OUTDOOR_ORDER] : [...URBAN_ORDER];
}

export function itemPackDisplayGroup(
  trip: Trip,
  item: Pick<Item, "category" | "name" | "nameEn" | "nameZh">,
): PackDisplayGroup {
  return tripUsesOutdoorPackGrouping(trip) ? outdoorGroupForItem(item) : urbanGroupForItem(item);
}

export function i18nKeyForPackDisplayGroup(g: PackDisplayGroup): string {
  return `pack.displayGroup.${g}`;
}

/** 若线上 i18n 未含新 key，避免把 raw key 露给用户（CDN/Workers 旧包时仍可读）。 */
const PACK_DISPLAY_GROUP_FALLBACK_EN: Record<PackDisplayGroup, string> = {
  sleep: "Sleep system",
  wear: "Clothing & layers",
  cook: "Cook kit",
  nav: "Navigation & safety",
  move: "Trekking gear",
  resupply: "Food & water",
  other: "Other",
  apparel: "Clothes",
  footwear: "Footwear",
  tech: "Electronics",
  health: "Toiletries",
  doc: "Documents",
  misc: "Misc & small items",
};

export function packDisplayGroupLabel(t: (key: string) => string, g: PackDisplayGroup): string {
  const key = i18nKeyForPackDisplayGroup(g);
  const s = t(key);
  return s !== key ? s : PACK_DISPLAY_GROUP_FALLBACK_EN[g];
}

/** Default row category when adding custom gear from a pack display section. */
export function defaultItemCategoryForPackDisplayGroup(g: PackDisplayGroup): Item["category"] {
  if ((URBAN_ORDER as readonly PackDisplayGroup[]).includes(g)) {
    const urban: Record<UrbanDisplayGroup, Item["category"]> = {
      apparel: "apparel",
      footwear: "apparel",
      tech: "tech",
      health: "health",
      doc: "doc",
      misc: "misc",
    };
    return urban[g as UrbanDisplayGroup];
  }
  const outdoor: Record<OutdoorDisplayGroup, Item["category"]> = {
    sleep: "misc",
    wear: "apparel",
    cook: "misc",
    nav: "misc",
    move: "misc",
    resupply: "health",
    other: "misc",
  };
  return outdoor[g as OutdoorDisplayGroup];
}
