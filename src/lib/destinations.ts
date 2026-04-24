// Hierarchical destination database — Country → Region/Province → City
// Bilingual labels (en + zh). Lightweight curated list (extendable).

export type City = { id: string; en: string; zh: string };
export type Region = { id: string; en: string; zh: string; cities: City[] };
export type Country = { id: string; en: string; zh: string; flag: string; regions: Region[] };

export const destinationTree: Country[] = [
  {
    id: "jp",
    en: "Japan",
    zh: "日本",
    flag: "🇯🇵",
    regions: [
      {
        id: "jp-hokkaido", en: "Hokkaido", zh: "北海道",
        cities: [
          { id: "jp-sapporo", en: "Sapporo", zh: "札幌" },
          { id: "jp-furano", en: "Furano", zh: "富良野" },
          { id: "jp-otaru", en: "Otaru", zh: "小樽" },
          { id: "jp-niseko", en: "Niseko", zh: "二世古" },
        ],
      },
      {
        id: "jp-kanto", en: "Kanto", zh: "关东",
        cities: [
          { id: "jp-tokyo", en: "Tokyo", zh: "东京" },
          { id: "jp-yokohama", en: "Yokohama", zh: "横滨" },
          { id: "jp-kamakura", en: "Kamakura", zh: "镰仓" },
        ],
      },
      {
        id: "jp-kansai", en: "Kansai", zh: "关西",
        cities: [
          { id: "jp-kyoto", en: "Kyoto", zh: "京都" },
          { id: "jp-osaka", en: "Osaka", zh: "大阪" },
          { id: "jp-nara", en: "Nara", zh: "奈良" },
        ],
      },
      {
        id: "jp-okinawa", en: "Okinawa", zh: "冲绳",
        cities: [
          { id: "jp-naha", en: "Naha", zh: "那霸" },
          { id: "jp-ishigaki", en: "Ishigaki", zh: "石垣岛" },
        ],
      },
    ],
  },
  {
    id: "cn",
    en: "China",
    zh: "中国",
    flag: "🇨🇳",
    regions: [
      {
        id: "cn-yunnan", en: "Yunnan", zh: "云南",
        cities: [
          { id: "cn-kunming", en: "Kunming", zh: "昆明" },
          { id: "cn-dali", en: "Dali", zh: "大理" },
          { id: "cn-lijiang", en: "Lijiang", zh: "丽江" },
          { id: "cn-shangri-la", en: "Shangri-La", zh: "香格里拉" },
        ],
      },
      {
        id: "cn-sichuan", en: "Sichuan", zh: "四川",
        cities: [
          { id: "cn-chengdu", en: "Chengdu", zh: "成都" },
          { id: "cn-jiuzhaigou", en: "Jiuzhaigou", zh: "九寨沟" },
          { id: "cn-daocheng", en: "Daocheng Yading", zh: "稻城亚丁" },
        ],
      },
      {
        id: "cn-tibet", en: "Tibet", zh: "西藏",
        cities: [
          { id: "cn-lhasa", en: "Lhasa", zh: "拉萨" },
          { id: "cn-everest-bc", en: "Everest BC", zh: "珠峰大本营" },
          { id: "cn-ngari", en: "Ngari", zh: "阿里" },
        ],
      },
      {
        id: "cn-xinjiang", en: "Xinjiang", zh: "新疆",
        cities: [
          { id: "cn-urumqi", en: "Urumqi", zh: "乌鲁木齐" },
          { id: "cn-kashgar", en: "Kashgar", zh: "喀什" },
          { id: "cn-kanas", en: "Kanas", zh: "喀纳斯" },
        ],
      },
      {
        id: "cn-shanghai", en: "Shanghai", zh: "上海",
        cities: [{ id: "cn-shanghai-c", en: "Shanghai", zh: "上海" }],
      },
      {
        id: "cn-beijing", en: "Beijing", zh: "北京",
        cities: [{ id: "cn-beijing-c", en: "Beijing", zh: "北京" }],
      },
    ],
  },
  {
    id: "is",
    en: "Iceland",
    zh: "冰岛",
    flag: "🇮🇸",
    regions: [
      {
        id: "is-south", en: "South Coast", zh: "南岸",
        cities: [
          { id: "is-reykjavik", en: "Reykjavík", zh: "雷克雅未克" },
          { id: "is-vik", en: "Vík", zh: "维克" },
          { id: "is-jokulsarlon", en: "Jökulsárlón", zh: "杰古沙龙冰湖" },
        ],
      },
      {
        id: "is-north", en: "North", zh: "北部",
        cities: [
          { id: "is-akureyri", en: "Akureyri", zh: "阿克雷里" },
          { id: "is-husavik", en: "Húsavík", zh: "胡萨维克" },
        ],
      },
    ],
  },
  {
    id: "ar",
    en: "Argentina",
    zh: "阿根廷",
    flag: "🇦🇷",
    regions: [
      {
        id: "ar-patagonia", en: "Patagonia", zh: "巴塔哥尼亚",
        cities: [
          { id: "ar-elcalafate", en: "El Calafate", zh: "卡拉法特" },
          { id: "ar-elchalten", en: "El Chaltén", zh: "查尔滕" },
          { id: "ar-ushuaia", en: "Ushuaia", zh: "乌斯怀亚" },
        ],
      },
    ],
  },
  {
    id: "ma",
    en: "Morocco",
    zh: "摩洛哥",
    flag: "🇲🇦",
    regions: [
      {
        id: "ma-sahara", en: "Sahara", zh: "撒哈拉",
        cities: [
          { id: "ma-merzouga", en: "Merzouga", zh: "梅尔祖卡" },
          { id: "ma-zagora", en: "Zagora", zh: "扎戈拉" },
        ],
      },
      {
        id: "ma-imperial", en: "Imperial Cities", zh: "皇城",
        cities: [
          { id: "ma-marrakech", en: "Marrakech", zh: "马拉喀什" },
          { id: "ma-fes", en: "Fes", zh: "非斯" },
          { id: "ma-chefchaouen", en: "Chefchaouen", zh: "舍夫沙万" },
        ],
      },
    ],
  },
  {
    id: "np",
    en: "Nepal",
    zh: "尼泊尔",
    flag: "🇳🇵",
    regions: [
      {
        id: "np-everest", en: "Everest Region", zh: "珠峰地区",
        cities: [
          { id: "np-lukla", en: "Lukla", zh: "卢卡拉" },
          { id: "np-namche", en: "Namche Bazaar", zh: "南崎" },
          { id: "np-ebc", en: "EBC", zh: "珠峰大本营" },
        ],
      },
      {
        id: "np-annapurna", en: "Annapurna", zh: "安纳普尔纳",
        cities: [
          { id: "np-pokhara", en: "Pokhara", zh: "博卡拉" },
          { id: "np-abc", en: "ABC", zh: "安纳普尔纳大本营" },
        ],
      },
    ],
  },
];

export type SelectedDestination = {
  id: string;       // city id
  countryId: string;
  regionId: string;
  cityEn: string;
  cityZh: string;
  countryFlag: string;
};

export function flattenSearch(query: string): SelectedDestination[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: SelectedDestination[] = [];
  for (const c of destinationTree) {
    for (const r of c.regions) {
      for (const ci of r.cities) {
        const hay = `${c.en} ${c.zh} ${r.en} ${r.zh} ${ci.en} ${ci.zh}`.toLowerCase();
        if (hay.includes(q)) {
          out.push({
            id: ci.id, countryId: c.id, regionId: r.id,
            cityEn: ci.en, cityZh: ci.zh, countryFlag: c.flag,
          });
        }
      }
    }
  }
  return out.slice(0, 20);
}

export function formatDestinations(
  list: SelectedDestination[],
  lang: "en" | "zh" | "ja",
): string {
  if (list.length === 0) return "—";
  return list.map((d) => (lang === "zh" ? d.cityZh : d.cityEn)).join(" · ");
}
