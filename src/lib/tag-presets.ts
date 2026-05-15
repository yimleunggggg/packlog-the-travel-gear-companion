import type { Lang } from "@/lib/i18n";

export type TagPresetGroup = "destination" | "activity" | "style" | "season";

type Row = readonly [id: string, group: TagPresetGroup, en: string, zh: string, ja: string];

/** Canonical ids stored on trips / templates; labels localized. Legacy slugs (e.g. camera) stay valid. */
const ROWS: Row[] = [
  // destination
  ["japan", "destination", "Japan", "日本", "日本"],
  ["thailand", "destination", "Thailand", "泰国", "タイ"],
  ["china", "destination", "China", "中国", "中国"],
  ["south-korea", "destination", "South Korea", "韩国", "韓国"],
  ["taiwan", "destination", "Taiwan", "台湾", "台湾"],
  ["hong-kong", "destination", "Hong Kong", "香港", "香港"],
  ["vietnam", "destination", "Vietnam", "越南", "ベトナム"],
  ["singapore", "destination", "Singapore", "新加坡", "シンガポール"],
  ["malaysia", "destination", "Malaysia", "马来西亚", "マレーシア"],
  ["indonesia", "destination", "Indonesia", "印度尼西亚", "インドネシア"],
  ["nepal", "destination", "Nepal", "尼泊尔", "ネパール"],
  ["iceland", "destination", "Iceland", "冰岛", "アイスランド"],
  ["new-zealand", "destination", "New Zealand", "新西兰", "ニュージーランド"],
  ["patagonia", "destination", "Patagonia", "巴塔哥尼亚", "パタゴニア"],
  ["europe", "destination", "Europe", "欧洲", "ヨーロッパ"],
  ["southeast-asia", "destination", "Southeast Asia", "东南亚", "東南アジア"],
  ["north-america", "destination", "North America", "北美", "北米"],
  ["south-america", "destination", "South America", "南美", "南米"],
  ["australia", "destination", "Australia", "澳大利亚", "オーストラリア"],
  ["usa", "destination", "United States", "美国", "アメリカ"],
  ["canada", "destination", "Canada", "加拿大", "カナダ"],
  ["uk", "destination", "United Kingdom", "英国", "イギリス"],
  ["switzerland", "destination", "Switzerland", "瑞士", "スイス"],
  ["alps", "destination", "Alps", "阿尔卑斯", "アルプス"],
  ["himalaya", "destination", "Himalaya", "喜马拉雅", "ヒマラヤ"],
  ["africa", "destination", "Africa", "非洲", "アフリカ"],
  ["middle-east", "destination", "Middle East", "中东", "中東"],
  ["mediterranean", "destination", "Mediterranean", "地中海", "地中海"],
  ["caribbean", "destination", "Caribbean", "加勒比", "カリブ"],
  ["hokkaido", "destination", "Hokkaido", "北海道", "北海道"],
  ["okinawa", "destination", "Okinawa", "冲绳", "沖縄"],
  ["tibet", "destination", "Tibet", "西藏", "チベット"],
  ["xinjiang", "destination", "Xinjiang", "新疆", "新疆"],

  // activity
  ["hiking", "activity", "Hiking", "徒步", "ハイキング"],
  ["camping", "activity", "Camping", "露营", "キャンプ"],
  ["trail-running", "activity", "Trail running", "越野跑", "トレイルラン"],
  ["diving", "activity", "Diving", "潜水", "ダイビング"],
  ["snorkeling", "activity", "Snorkeling", "浮潜", "シュノーケル"],
  ["skiing", "activity", "Skiing", "滑雪", "スキー"],
  ["snowboarding", "activity", "Snowboarding", "单板", "スノーボード"],
  ["climbing", "activity", "Climbing", "攀岩", "クライミング"],
  ["surfing", "activity", "Surfing", "冲浪", "サーフィン"],
  ["cycling", "activity", "Cycling", "骑行", "サイクリング"],
  ["fishing", "activity", "Fishing", "钓鱼", "釣り"],
  ["photography", "activity", "Photography", "摄影", "撮影"],
  ["self-drive", "activity", "Road trip", "自驾", "ドライブ旅行"],
  ["city-explore", "activity", "City exploring", "城市探索", "街歩き"],
  ["remote-work", "activity", "Remote work", "远程办公", "リモートワーク"],
  ["music-festival", "activity", "Music festival", "音乐节", "フェス"],
  ["backpacking", "activity", "Backpacking", "背包徒步", "バックパッキング"],
  ["kayaking", "activity", "Kayaking", "皮划艇", "カヤック"],
  ["safari", "activity", "Safari", "游猎", "サファリ"],
  ["birding", "activity", "Birding", "观鸟", "バードウォッチング"],
  ["yoga", "activity", "Yoga / wellness", "瑜伽 / 康养", "ヨガ"],
  ["business", "activity", "Business trip", "出差", "出張"],
  ["food-tour", "activity", "Food trip", "美食之旅", "グルメ旅"],
  ["outdoor", "activity", "Outdoor", "户外", "アウトドア"],
  ["first-aid", "activity", "First aid", "急救", "救急"],
  ["wilderness", "activity", "Wilderness", "野外", "荒野"],
  ["mountaineering", "activity", "Mountaineering", "登山", "登山"],
  ["ultra", "activity", "Ultra distance", "超长距离", "ウルトラ"],
  ["fastpack", "activity", "Fastpacking", "快速打包", "ファストパック"],
  ["desert", "activity", "Desert", "沙漠", "砂漠"],
  ["powder", "activity", "Powder snow", "粉雪", "パウダー"],

  // style
  ["minimal", "style", "Minimal carry", "极简", "ミニマル"],
  ["ultralight", "style", "Ultralight", "轻量化", "ウルトラライト"],
  ["glamping", "style", "Glamping", "豪华露营", "グランピング"],
  ["self-supported", "style", "Self-supported", "自补给", "自給自足"],
  ["family", "style", "Family", "亲子", "ファミリー"],
  ["solo", "style", "Solo", "独行", "ソロ"],
  ["couple", "style", "Two travelers", "双人", "二人旅"],
  ["luxury", "style", "Comfort-first", "舒适向", "快適重視"],
  ["budget", "style", "Budget", "省钱向", "節約"],
  ["digital-nomad", "style", "Digital nomad", "数字游民", "ノマド"],
  ["racing", "style", "Race / event", "赛事", "レース"],
  ["rei", "style", "REI-style list", "REI 清单", "REI 系"],

  // season / climate
  ["spring", "season", "Spring", "春季", "春"],
  ["summer", "season", "Summer", "夏季", "夏"],
  ["fall", "season", "Autumn", "秋季", "秋"],
  ["winter", "season", "Winter", "冬季", "冬"],
  ["rainy-season", "season", "Rainy season", "雨季", "雨季"],
  ["dry-season", "season", "Dry season", "干季", "乾季"],
  ["rain", "season", "Rain / wet", "雨天", "雨"],
  ["hot", "season", "Hot weather", "高温", "高温"],
  ["cold", "season", "Cold / winter", "严寒", "厳寒"],
  ["monsoon", "season", "Monsoon", "季风季", "モンスーン"],
  ["typhoon", "season", "Typhoon season", "台风季", "台風シーズン"],
  ["3-season", "season", "Three-season", "三季", "三シーズン"],
  ["mountain", "season", "Mountains", "山地", "山岳"],
  ["alpine", "season", "Alpine / highland", "高海拔", "高地"],
  ["health", "season", "Health / hygiene", "健康", "健康"],
  ["emergency", "season", "Emergency prep", "应急", "緊急"],
];

const LABEL: Record<string, Record<Lang, string>> = {};
for (const [id, , en, zh, ja] of ROWS) {
  LABEL[id] = { en, zh, ja };
}

/** One canonical id per “meaning” for filter matching (legacy + new). */
const CANONICAL: Record<string, string> = {
  camera: "photography",
  ski: "skiing",
  city: "city-explore",
};

export function canonicalTagKey(raw: string): string {
  const k = raw.replace(/^#/, "").trim().toLowerCase();
  if (!k) return "";
  return CANONICAL[k] ?? k;
}

export function isPresetTagId(raw: string): boolean {
  const k = canonicalTagKey(raw);
  return Boolean(LABEL[k]);
}

export function getPresetLabel(raw: string, lang: Lang): string | undefined {
  const k = canonicalTagKey(raw);
  const row = LABEL[k];
  if (!row) return undefined;
  return row[lang] ?? row.en;
}

export function formatTagForUi(raw: string, lang: Lang): string {
  const trimmed = raw.replace(/^#/, "").trim();
  if (!trimmed) return "";
  return getPresetLabel(trimmed, lang) ?? trimmed;
}

export function tagKeysMatch(a: string, b: string): boolean {
  return canonicalTagKey(a) === canonicalTagKey(b);
}

export function listPresetGroups(): TagPresetGroup[] {
  return ["destination", "activity", "style", "season"];
}

export type PresetTagRow = { id: string; group: TagPresetGroup; labels: Record<Lang, string> };

export function listAllPresets(): PresetTagRow[] {
  return ROWS.map(([id, group, en, zh, ja]) => ({
    id,
    group,
    labels: { en, zh, ja },
  }));
}

/** Grid: hide duplicate ids that only exist as legacy synonyms in CANONICAL source. */
export function listPresetsForPickerGrid(): PresetTagRow[] {
  const hiddenFromGrid = new Set(Object.keys(CANONICAL));
  return listAllPresets().filter((p) => !hiddenFromGrid.has(p.id));
}

export function filterPresetsByQuery(query: string, lang: Lang): PresetTagRow[] {
  const q = query.trim().toLowerCase();
  const pool = listPresetsForPickerGrid();
  if (!q) return pool;
  return pool.filter((p) => {
    const hay = [p.id, p.labels.en, p.labels.zh, p.labels.ja].join("\n").toLowerCase();
    return hay.includes(q);
  });
}

export function tagListIncludesFilter(
  tags: string[] | undefined,
  filter: string | undefined,
): boolean {
  const f = filter?.trim();
  if (!f) return true;
  return (tags ?? []).some((t) => tagKeysMatch(t, f));
}

export type TripTagMatchStrength = "exact" | "fuzzy" | "none";

/**
 * Tag archive filter: canonical / legacy id match first (`exact`), then loose substring
 * on preset labels + tag id (`fuzzy`, filter length ≥ 3). Prefer showing exact matches first in UI.
 */
export function tripTagMatchStrength(
  tags: string[] | undefined,
  filterRaw: string,
): TripTagMatchStrength {
  const f = filterRaw?.trim();
  if (!f) return "exact";
  if (tagListIncludesFilter(tags, f)) return "exact";
  const fq = f.replace(/^#/, "").toLowerCase();
  if (fq.length < 3) return "none";
  const tagsArr = tags ?? [];
  for (const rawTag of tagsArr) {
    const k = canonicalTagKey(rawTag).toLowerCase();
    const raw = rawTag.replace(/^#/, "").trim().toLowerCase();
    const labelHay = (["en", "zh", "ja"] as const)
      .map((lang) => getPresetLabel(rawTag, lang)?.toLowerCase() ?? "")
      .filter(Boolean);
    const hay = [k, raw, ...labelHay];
    if (hay.some((s) => s.includes(fq))) return "fuzzy";
  }
  return "none";
}
