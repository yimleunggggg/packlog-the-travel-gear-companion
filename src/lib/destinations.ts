// Hierarchical destination database — Country → Region/Province → City
// Bilingual labels (en + zh). Curated for global outdoor & travel coverage.
// Country-first navigation; multi-select; fuzzy search across all levels.

export type City = { id: string; en: string; zh: string };
export type Region = { id: string; en: string; zh: string; cities: City[] };
export type Country = {
  id: string; en: string; zh: string; flag: string;
  continent: "Asia" | "Europe" | "Americas" | "Africa" | "Oceania";
  regions: Region[];
};

const c = (id: string, en: string, zh: string): City => ({ id, en, zh });

export const destinationTree: Country[] = [
  /* ============== ASIA ============== */
  {
    id: "jp", en: "Japan", zh: "日本", flag: "🇯🇵", continent: "Asia",
    regions: [
      { id: "jp-hokkaido", en: "Hokkaido", zh: "北海道", cities: [
        c("jp-sapporo", "Sapporo", "札幌"), c("jp-furano", "Furano", "富良野"),
        c("jp-otaru", "Otaru", "小樽"), c("jp-niseko", "Niseko", "二世古"),
        c("jp-hakodate", "Hakodate", "函馆"), c("jp-asahikawa", "Asahikawa", "旭川"),
      ]},
      { id: "jp-tohoku", en: "Tohoku", zh: "东北", cities: [
        c("jp-sendai", "Sendai", "仙台"), c("jp-aomori", "Aomori", "青森"),
        c("jp-akita", "Akita", "秋田"), c("jp-yamagata", "Yamagata", "山形"),
      ]},
      { id: "jp-kanto", en: "Kanto", zh: "关东", cities: [
        c("jp-tokyo", "Tokyo", "东京"), c("jp-yokohama", "Yokohama", "横滨"),
        c("jp-kamakura", "Kamakura", "镰仓"), c("jp-nikko", "Nikko", "日光"),
        c("jp-hakone", "Hakone", "箱根"),
      ]},
      { id: "jp-chubu", en: "Chubu", zh: "中部", cities: [
        c("jp-nagoya", "Nagoya", "名古屋"), c("jp-takayama", "Takayama", "高山"),
        c("jp-kanazawa", "Kanazawa", "金泽"), c("jp-shirakawago", "Shirakawa-go", "白川乡"),
        c("jp-kamikochi", "Kamikōchi", "上高地"), c("jp-mtfuji", "Mt. Fuji", "富士山"),
      ]},
      { id: "jp-kansai", en: "Kansai", zh: "关西", cities: [
        c("jp-kyoto", "Kyoto", "京都"), c("jp-osaka", "Osaka", "大阪"),
        c("jp-nara", "Nara", "奈良"), c("jp-kobe", "Kobe", "神户"),
        c("jp-himeji", "Himeji", "姬路"),
      ]},
      { id: "jp-chugoku", en: "Chugoku", zh: "中国地方", cities: [
        c("jp-hiroshima", "Hiroshima", "广岛"), c("jp-okayama", "Okayama", "冈山"),
        c("jp-miyajima", "Miyajima", "宫岛"),
      ]},
      { id: "jp-shikoku", en: "Shikoku", zh: "四国", cities: [
        c("jp-matsuyama", "Matsuyama", "松山"), c("jp-takamatsu", "Takamatsu", "高松"),
        c("jp-naoshima", "Naoshima", "直岛"),
      ]},
      { id: "jp-kyushu", en: "Kyushu", zh: "九州", cities: [
        c("jp-fukuoka", "Fukuoka", "福冈"), c("jp-nagasaki", "Nagasaki", "长崎"),
        c("jp-kumamoto", "Kumamoto", "熊本"), c("jp-beppu", "Beppu", "别府"),
        c("jp-kagoshima", "Kagoshima", "鹿儿岛"),
        c("jp-yakushima", "Yakushima", "屋久岛"),
        c("jp-amami", "Amami Ōshima", "奄美大岛"),
      ]},
      { id: "jp-okinawa", en: "Okinawa", zh: "冲绳", cities: [
        c("jp-naha", "Naha", "那霸"), c("jp-ishigaki", "Ishigaki", "石垣岛"),
        c("jp-miyako", "Miyako", "宫古岛"), c("jp-iriomote", "Iriomote", "西表岛"),
      ]},
    ],
  },
  {
    id: "cn", en: "China", zh: "中国", flag: "🇨🇳", continent: "Asia",
    regions: [
      { id: "cn-beijing", en: "Beijing", zh: "北京", cities: [c("cn-beijing-c", "Beijing", "北京")] },
      { id: "cn-shanghai", en: "Shanghai", zh: "上海", cities: [c("cn-shanghai-c", "Shanghai", "上海")] },
      { id: "cn-guangdong", en: "Guangdong", zh: "广东", cities: [
        c("cn-guangzhou", "Guangzhou", "广州"), c("cn-shenzhen", "Shenzhen", "深圳"),
        c("cn-zhuhai", "Zhuhai", "珠海"),
      ]},
      { id: "cn-zhejiang", en: "Zhejiang", zh: "浙江", cities: [
        c("cn-hangzhou", "Hangzhou", "杭州"), c("cn-ningbo", "Ningbo", "宁波"),
        c("cn-zhoushan", "Zhoushan", "舟山"),
      ]},
      { id: "cn-yunnan", en: "Yunnan", zh: "云南", cities: [
        c("cn-kunming", "Kunming", "昆明"), c("cn-dali", "Dali", "大理"),
        c("cn-lijiang", "Lijiang", "丽江"), c("cn-shangri-la", "Shangri-La", "香格里拉"),
        c("cn-meili", "Meili Snow Mountain", "梅里雪山"),
      ]},
      { id: "cn-sichuan", en: "Sichuan", zh: "四川", cities: [
        c("cn-chengdu", "Chengdu", "成都"), c("cn-jiuzhaigou", "Jiuzhaigou", "九寨沟"),
        c("cn-daocheng", "Daocheng Yading", "稻城亚丁"), c("cn-siguniang", "Mt. Siguniang", "四姑娘山"),
      ]},
      { id: "cn-tibet", en: "Tibet", zh: "西藏", cities: [
        c("cn-lhasa", "Lhasa", "拉萨"), c("cn-everest-bc", "Everest BC (CN)", "珠峰大本营"),
        c("cn-ngari", "Ngari", "阿里"), c("cn-shigatse", "Shigatse", "日喀则"),
      ]},
      { id: "cn-xinjiang", en: "Xinjiang", zh: "新疆", cities: [
        c("cn-urumqi", "Urumqi", "乌鲁木齐"), c("cn-kashgar", "Kashgar", "喀什"),
        c("cn-kanas", "Kanas", "喀纳斯"), c("cn-tashkurgan", "Tashkurgan", "塔什库尔干"),
      ]},
      { id: "cn-qinghai", en: "Qinghai", zh: "青海", cities: [
        c("cn-xining", "Xining", "西宁"), c("cn-qinghai-lake", "Qinghai Lake", "青海湖"),
        c("cn-chaka", "Chaka Salt Lake", "茶卡盐湖"),
      ]},
      { id: "cn-gansu", en: "Gansu", zh: "甘肃", cities: [
        c("cn-lanzhou", "Lanzhou", "兰州"), c("cn-dunhuang", "Dunhuang", "敦煌"),
        c("cn-zhangye", "Zhangye Danxia", "张掖丹霞"),
      ]},
      { id: "cn-fujian", en: "Fujian", zh: "福建", cities: [
        c("cn-xiamen", "Xiamen", "厦门"), c("cn-fuzhou", "Fuzhou", "福州"),
      ]},
      { id: "cn-hk", en: "Hong Kong", zh: "香港", cities: [c("cn-hk-c", "Hong Kong", "香港")] },
      { id: "cn-mo", en: "Macau", zh: "澳门", cities: [c("cn-mo-c", "Macau", "澳门")] },
      { id: "cn-tw", en: "Taiwan", zh: "台湾", cities: [
        c("cn-taipei", "Taipei", "台北"), c("cn-taichung", "Taichung", "台中"),
        c("cn-kaohsiung", "Kaohsiung", "高雄"), c("cn-hualien", "Hualien", "花莲"),
      ]},
    ],
  },
  {
    id: "kr", en: "South Korea", zh: "韩国", flag: "🇰🇷", continent: "Asia",
    regions: [
      { id: "kr-capital", en: "Seoul Capital", zh: "首都圈", cities: [
        c("kr-seoul", "Seoul", "首尔"), c("kr-incheon", "Incheon", "仁川"),
      ]},
      { id: "kr-gyeongsang", en: "Gyeongsang", zh: "庆尚", cities: [
        c("kr-busan", "Busan", "釜山"), c("kr-gyeongju", "Gyeongju", "庆州"),
      ]},
      { id: "kr-jeju", en: "Jeju", zh: "济州", cities: [c("kr-jeju-c", "Jeju", "济州")] },
    ],
  },
  {
    id: "th", en: "Thailand", zh: "泰国", flag: "🇹🇭", continent: "Asia",
    regions: [
      { id: "th-central", en: "Central", zh: "中部", cities: [
        c("th-bangkok", "Bangkok", "曼谷"), c("th-ayutthaya", "Ayutthaya", "大城"),
      ]},
      { id: "th-north", en: "North", zh: "北部", cities: [
        c("th-chiangmai", "Chiang Mai", "清迈"), c("th-chiangrai", "Chiang Rai", "清莱"),
        c("th-pai", "Pai", "拜县"),
      ]},
      { id: "th-south", en: "South / Islands", zh: "南部 / 海岛", cities: [
        c("th-phuket", "Phuket", "普吉"), c("th-krabi", "Krabi", "甲米"),
        c("th-kohsamui", "Koh Samui", "苏梅岛"), c("th-kohphangan", "Koh Phangan", "帕岸岛"),
        c("th-kohtao", "Koh Tao", "涛岛"), c("th-similan", "Similan Is.", "斯米兰群岛"),
      ]},
    ],
  },
  {
    id: "vn", en: "Vietnam", zh: "越南", flag: "🇻🇳", continent: "Asia",
    regions: [
      { id: "vn-north", en: "North", zh: "北部", cities: [
        c("vn-hanoi", "Hanoi", "河内"), c("vn-halong", "Ha Long Bay", "下龙湾"),
        c("vn-sapa", "Sapa", "沙巴"), c("vn-ninhbinh", "Ninh Binh", "宁平"),
      ]},
      { id: "vn-central", en: "Central", zh: "中部", cities: [
        c("vn-danang", "Da Nang", "岘港"), c("vn-hoian", "Hoi An", "会安"),
        c("vn-hue", "Hue", "顺化"),
      ]},
      { id: "vn-south", en: "South", zh: "南部", cities: [
        c("vn-saigon", "Ho Chi Minh City", "胡志明市"), c("vn-phuquoc", "Phu Quoc", "富国岛"),
        c("vn-mui-ne", "Mui Ne", "美奈"),
      ]},
    ],
  },
  {
    id: "id", en: "Indonesia", zh: "印度尼西亚", flag: "🇮🇩", continent: "Asia",
    regions: [
      { id: "id-bali", en: "Bali & Nusa", zh: "巴厘岛 / 努沙", cities: [
        c("id-denpasar", "Denpasar", "登巴萨"), c("id-ubud", "Ubud", "乌布"),
        c("id-canggu", "Canggu", "卡努谷"), c("id-uluwatu", "Uluwatu", "乌鲁瓦图"),
        c("id-nusapenida", "Nusa Penida", "佩尼达岛"),
      ]},
      { id: "id-java", en: "Java", zh: "爪哇", cities: [
        c("id-jakarta", "Jakarta", "雅加达"), c("id-yogyakarta", "Yogyakarta", "日惹"),
        c("id-bromo", "Mt. Bromo", "布罗莫火山"),
      ]},
      { id: "id-other", en: "Other Islands", zh: "其他海岛", cities: [
        c("id-lombok", "Lombok", "龙目岛"), c("id-komodo", "Komodo", "科莫多"),
        c("id-rajaampat", "Raja Ampat", "拉贾安帕"),
      ]},
    ],
  },
  {
    id: "ph", en: "Philippines", zh: "菲律宾", flag: "🇵🇭", continent: "Asia",
    regions: [
      { id: "ph-luzon", en: "Luzon", zh: "吕宋", cities: [
        c("ph-manila", "Manila", "马尼拉"), c("ph-banaue", "Banaue", "巴拿威"),
      ]},
      { id: "ph-visayas", en: "Visayas", zh: "维萨亚斯", cities: [
        c("ph-cebu", "Cebu", "宿务"), c("ph-bohol", "Bohol", "薄荷岛"),
        c("ph-boracay", "Boracay", "长滩岛"),
      ]},
      { id: "ph-palawan", en: "Palawan", zh: "巴拉望", cities: [
        c("ph-elnido", "El Nido", "爱妮岛"), c("ph-coron", "Coron", "科隆"),
      ]},
    ],
  },
  {
    id: "my", en: "Malaysia", zh: "马来西亚", flag: "🇲🇾", continent: "Asia",
    regions: [
      { id: "my-peninsula", en: "Peninsula", zh: "马来半岛", cities: [
        c("my-kl", "Kuala Lumpur", "吉隆坡"), c("my-penang", "Penang", "槟城"),
        c("my-langkawi", "Langkawi", "兰卡威"), c("my-malacca", "Malacca", "马六甲"),
      ]},
      { id: "my-borneo", en: "Borneo", zh: "婆罗洲", cities: [
        c("my-kk", "Kota Kinabalu", "亚庇"), c("my-kuching", "Kuching", "古晋"),
      ]},
    ],
  },
  {
    id: "sg", en: "Singapore", zh: "新加坡", flag: "🇸🇬", continent: "Asia",
    regions: [{ id: "sg-c", en: "Singapore", zh: "新加坡", cities: [c("sg-c-c", "Singapore", "新加坡")] }],
  },
  {
    id: "in", en: "India", zh: "印度", flag: "🇮🇳", continent: "Asia",
    regions: [
      { id: "in-north", en: "North / Himalaya", zh: "北部 / 喜马拉雅", cities: [
        c("in-delhi", "Delhi", "德里"), c("in-leh", "Leh", "列城"),
        c("in-rishikesh", "Rishikesh", "瑞诗凯诗"), c("in-manali", "Manali", "马纳里"),
      ]},
      { id: "in-rajasthan", en: "Rajasthan", zh: "拉贾斯坦", cities: [
        c("in-jaipur", "Jaipur", "斋浦尔"), c("in-jaisalmer", "Jaisalmer", "杰伊瑟尔梅尔"),
        c("in-udaipur", "Udaipur", "乌代布尔"),
      ]},
      { id: "in-south", en: "South", zh: "南部", cities: [
        c("in-mumbai", "Mumbai", "孟买"), c("in-goa", "Goa", "果阿"),
        c("in-kerala", "Kerala", "喀拉拉"),
      ]},
    ],
  },
  {
    id: "np", en: "Nepal", zh: "尼泊尔", flag: "🇳🇵", continent: "Asia",
    regions: [
      { id: "np-everest", en: "Everest Region", zh: "珠峰地区", cities: [
        c("np-lukla", "Lukla", "卢卡拉"), c("np-namche", "Namche Bazaar", "南崎"),
        c("np-ebc", "EBC", "珠峰大本营"), c("np-gokyo", "Gokyo", "戈焦"),
      ]},
      { id: "np-annapurna", en: "Annapurna", zh: "安纳普尔纳", cities: [
        c("np-pokhara", "Pokhara", "博卡拉"), c("np-abc", "ABC", "安纳普尔纳大本营"),
        c("np-poonhill", "Poon Hill", "普恩山"),
      ]},
      { id: "np-kathmandu", en: "Kathmandu Valley", zh: "加德满都谷地", cities: [
        c("np-kathmandu", "Kathmandu", "加德满都"), c("np-bhaktapur", "Bhaktapur", "巴克塔普尔"),
      ]},
    ],
  },
  {
    id: "bt", en: "Bhutan", zh: "不丹", flag: "🇧🇹", continent: "Asia",
    regions: [{ id: "bt-c", en: "Central", zh: "中部", cities: [
      c("bt-paro", "Paro", "帕罗"), c("bt-thimphu", "Thimphu", "廷布"),
    ]}],
  },
  {
    id: "lk", en: "Sri Lanka", zh: "斯里兰卡", flag: "🇱🇰", continent: "Asia",
    regions: [{ id: "lk-c", en: "Central", zh: "中部", cities: [
      c("lk-colombo", "Colombo", "科伦坡"), c("lk-kandy", "Kandy", "康提"),
      c("lk-ella", "Ella", "埃拉"), c("lk-mirissa", "Mirissa", "米瑞莎"),
    ]}],
  },
  {
    id: "mv", en: "Maldives", zh: "马尔代夫", flag: "🇲🇻", continent: "Asia",
    regions: [{ id: "mv-c", en: "Atolls", zh: "环礁", cities: [c("mv-male", "Malé", "马累")] }],
  },
  {
    id: "ae", en: "UAE", zh: "阿联酋", flag: "🇦🇪", continent: "Asia",
    regions: [{ id: "ae-c", en: "Cities", zh: "城市", cities: [
      c("ae-dubai", "Dubai", "迪拜"), c("ae-abudhabi", "Abu Dhabi", "阿布扎比"),
    ]}],
  },
  {
    id: "tr", en: "Türkiye", zh: "土耳其", flag: "🇹🇷", continent: "Asia",
    regions: [{ id: "tr-c", en: "Cities", zh: "城市", cities: [
      c("tr-istanbul", "Istanbul", "伊斯坦布尔"), c("tr-cappadocia", "Cappadocia", "卡帕多奇亚"),
      c("tr-pamukkale", "Pamukkale", "棉花堡"), c("tr-antalya", "Antalya", "安塔利亚"),
    ]}],
  },

  /* ============== EUROPE ============== */
  {
    id: "is", en: "Iceland", zh: "冰岛", flag: "🇮🇸", continent: "Europe",
    regions: [
      { id: "is-south", en: "South Coast", zh: "南岸", cities: [
        c("is-reykjavik", "Reykjavík", "雷克雅未克"), c("is-vik", "Vík", "维克"),
        c("is-jokulsarlon", "Jökulsárlón", "杰古沙龙冰湖"), c("is-skogafoss", "Skógafoss", "斯科加瀑布"),
      ]},
      { id: "is-north", en: "North", zh: "北部", cities: [
        c("is-akureyri", "Akureyri", "阿克雷里"), c("is-husavik", "Húsavík", "胡萨维克"),
      ]},
      { id: "is-westfjords", en: "Westfjords", zh: "西峡湾", cities: [
        c("is-isafjordur", "Ísafjörður", "伊萨菲厄泽"),
      ]},
    ],
  },
  {
    id: "no", en: "Norway", zh: "挪威", flag: "🇳🇴", continent: "Europe",
    regions: [
      { id: "no-fjord", en: "Fjords", zh: "峡湾", cities: [
        c("no-bergen", "Bergen", "卑尔根"), c("no-flam", "Flåm", "弗拉姆"),
        c("no-geiranger", "Geiranger", "盖朗厄尔"),
      ]},
      { id: "no-arctic", en: "Arctic", zh: "北极圈", cities: [
        c("no-tromso", "Tromsø", "特罗姆瑟"), c("no-lofoten", "Lofoten", "罗弗敦"),
        c("no-svalbard", "Svalbard", "斯瓦尔巴"),
      ]},
      { id: "no-oslo", en: "Oslo", zh: "奥斯陆", cities: [c("no-oslo-c", "Oslo", "奥斯陆")] },
    ],
  },
  {
    id: "se", en: "Sweden", zh: "瑞典", flag: "🇸🇪", continent: "Europe",
    regions: [{ id: "se-c", en: "Cities", zh: "城市", cities: [
      c("se-stockholm", "Stockholm", "斯德哥尔摩"), c("se-gothenburg", "Gothenburg", "哥德堡"),
      c("se-kiruna", "Kiruna", "基律纳"),
    ]}],
  },
  {
    id: "fi", en: "Finland", zh: "芬兰", flag: "🇫🇮", continent: "Europe",
    regions: [{ id: "fi-c", en: "Cities", zh: "城市", cities: [
      c("fi-helsinki", "Helsinki", "赫尔辛基"), c("fi-rovaniemi", "Rovaniemi", "罗瓦涅米"),
    ]}],
  },
  {
    id: "fr", en: "France", zh: "法国", flag: "🇫🇷", continent: "Europe",
    regions: [
      { id: "fr-paris", en: "Île-de-France", zh: "巴黎大区", cities: [c("fr-paris", "Paris", "巴黎")] },
      { id: "fr-provence", en: "Provence / Riviera", zh: "普罗旺斯 / 蓝色海岸", cities: [
        c("fr-nice", "Nice", "尼斯"), c("fr-marseille", "Marseille", "马赛"),
        c("fr-cannes", "Cannes", "戛纳"), c("fr-aixenprovence", "Aix-en-Provence", "艾克斯"),
      ]},
      { id: "fr-alps", en: "French Alps", zh: "法国阿尔卑斯", cities: [
        c("fr-chamonix", "Chamonix", "霞慕尼"), c("fr-annecy", "Annecy", "安纳西"),
      ]},
      { id: "fr-loire", en: "Loire / Bordeaux", zh: "卢瓦尔 / 波尔多", cities: [
        c("fr-bordeaux", "Bordeaux", "波尔多"), c("fr-lyon", "Lyon", "里昂"),
      ]},
    ],
  },
  {
    id: "it", en: "Italy", zh: "意大利", flag: "🇮🇹", continent: "Europe",
    regions: [
      { id: "it-north", en: "North", zh: "北部", cities: [
        c("it-milan", "Milan", "米兰"), c("it-venice", "Venice", "威尼斯"),
        c("it-verona", "Verona", "维罗纳"), c("it-dolomites", "Dolomites", "多洛米蒂"),
      ]},
      { id: "it-central", en: "Central", zh: "中部", cities: [
        c("it-rome", "Rome", "罗马"), c("it-florence", "Florence", "佛罗伦萨"),
        c("it-cinqueterre", "Cinque Terre", "五渔村"),
      ]},
      { id: "it-south", en: "South / Islands", zh: "南部 / 海岛", cities: [
        c("it-naples", "Naples", "那不勒斯"), c("it-amalfi", "Amalfi", "阿马尔菲"),
        c("it-sicily", "Sicily", "西西里"), c("it-sardinia", "Sardinia", "撒丁岛"),
      ]},
    ],
  },
  {
    id: "es", en: "Spain", zh: "西班牙", flag: "🇪🇸", continent: "Europe",
    regions: [{ id: "es-c", en: "Cities", zh: "城市", cities: [
      c("es-madrid", "Madrid", "马德里"), c("es-barcelona", "Barcelona", "巴塞罗那"),
      c("es-seville", "Seville", "塞维利亚"), c("es-granada", "Granada", "格拉纳达"),
      c("es-mallorca", "Mallorca", "马略卡"), c("es-canary", "Canary Islands", "加那利群岛"),
    ]}],
  },
  {
    id: "pt", en: "Portugal", zh: "葡萄牙", flag: "🇵🇹", continent: "Europe",
    regions: [{ id: "pt-c", en: "Cities", zh: "城市", cities: [
      c("pt-lisbon", "Lisbon", "里斯本"), c("pt-porto", "Porto", "波尔图"),
      c("pt-azores", "Azores", "亚速尔"), c("pt-madeira", "Madeira", "马德拉"),
    ]}],
  },
  {
    id: "de", en: "Germany", zh: "德国", flag: "🇩🇪", continent: "Europe",
    regions: [{ id: "de-c", en: "Cities", zh: "城市", cities: [
      c("de-berlin", "Berlin", "柏林"), c("de-munich", "Munich", "慕尼黑"),
      c("de-hamburg", "Hamburg", "汉堡"), c("de-frankfurt", "Frankfurt", "法兰克福"),
    ]}],
  },
  {
    id: "ch", en: "Switzerland", zh: "瑞士", flag: "🇨🇭", continent: "Europe",
    regions: [{ id: "ch-alps", en: "Alps", zh: "阿尔卑斯", cities: [
      c("ch-zurich", "Zurich", "苏黎世"), c("ch-zermatt", "Zermatt", "采尔马特"),
      c("ch-interlaken", "Interlaken", "因特拉肯"), c("ch-grindelwald", "Grindelwald", "格林德瓦"),
      c("ch-stmoritz", "St. Moritz", "圣莫里茨"),
    ]}],
  },
  {
    id: "at", en: "Austria", zh: "奥地利", flag: "🇦🇹", continent: "Europe",
    regions: [{ id: "at-c", en: "Cities", zh: "城市", cities: [
      c("at-vienna", "Vienna", "维也纳"), c("at-salzburg", "Salzburg", "萨尔茨堡"),
      c("at-hallstatt", "Hallstatt", "哈尔施塔特"), c("at-innsbruck", "Innsbruck", "因斯布鲁克"),
    ]}],
  },
  {
    id: "nl", en: "Netherlands", zh: "荷兰", flag: "🇳🇱", continent: "Europe",
    regions: [{ id: "nl-c", en: "Cities", zh: "城市", cities: [
      c("nl-amsterdam", "Amsterdam", "阿姆斯特丹"), c("nl-rotterdam", "Rotterdam", "鹿特丹"),
    ]}],
  },
  {
    id: "be", en: "Belgium", zh: "比利时", flag: "🇧🇪", continent: "Europe",
    regions: [{ id: "be-c", en: "Cities", zh: "城市", cities: [
      c("be-brussels", "Brussels", "布鲁塞尔"), c("be-bruges", "Bruges", "布鲁日"),
    ]}],
  },
  {
    id: "uk", en: "United Kingdom", zh: "英国", flag: "🇬🇧", continent: "Europe",
    regions: [
      { id: "uk-england", en: "England", zh: "英格兰", cities: [
        c("uk-london", "London", "伦敦"), c("uk-manchester", "Manchester", "曼彻斯特"),
        c("uk-oxford", "Oxford", "牛津"), c("uk-cambridge", "Cambridge", "剑桥"),
        c("uk-lakedistrict", "Lake District", "湖区"),
      ]},
      { id: "uk-scotland", en: "Scotland", zh: "苏格兰", cities: [
        c("uk-edinburgh", "Edinburgh", "爱丁堡"), c("uk-skye", "Isle of Skye", "斯凯岛"),
        c("uk-glencoe", "Glencoe", "格伦科"),
      ]},
      { id: "uk-wales", en: "Wales", zh: "威尔士", cities: [c("uk-cardiff", "Cardiff", "卡迪夫")] },
    ],
  },
  {
    id: "ie", en: "Ireland", zh: "爱尔兰", flag: "🇮🇪", continent: "Europe",
    regions: [{ id: "ie-c", en: "Cities", zh: "城市", cities: [
      c("ie-dublin", "Dublin", "都柏林"), c("ie-galway", "Galway", "戈尔韦"),
      c("ie-cliffs", "Cliffs of Moher", "莫赫悬崖"),
    ]}],
  },
  {
    id: "gr", en: "Greece", zh: "希腊", flag: "🇬🇷", continent: "Europe",
    regions: [{ id: "gr-c", en: "Cities & Islands", zh: "城市与海岛", cities: [
      c("gr-athens", "Athens", "雅典"), c("gr-santorini", "Santorini", "圣托里尼"),
      c("gr-mykonos", "Mykonos", "米科诺斯"), c("gr-meteora", "Meteora", "迈泰奥拉"),
    ]}],
  },
  {
    id: "hr", en: "Croatia", zh: "克罗地亚", flag: "🇭🇷", continent: "Europe",
    regions: [{ id: "hr-c", en: "Cities", zh: "城市", cities: [
      c("hr-dubrovnik", "Dubrovnik", "杜布罗夫尼克"), c("hr-split", "Split", "斯普利特"),
      c("hr-zagreb", "Zagreb", "萨格勒布"), c("hr-plitvice", "Plitvice Lakes", "普利特维采"),
    ]}],
  },
  {
    id: "cz", en: "Czechia", zh: "捷克", flag: "🇨🇿", continent: "Europe",
    regions: [{ id: "cz-c", en: "Cities", zh: "城市", cities: [
      c("cz-prague", "Prague", "布拉格"), c("cz-cesky", "Český Krumlov", "克鲁姆洛夫"),
    ]}],
  },

  /* ============== AMERICAS ============== */
  {
    id: "us", en: "United States", zh: "美国", flag: "🇺🇸", continent: "Americas",
    regions: [
      { id: "us-west", en: "West Coast", zh: "西海岸", cities: [
        c("us-sf", "San Francisco", "旧金山"), c("us-la", "Los Angeles", "洛杉矶"),
        c("us-seattle", "Seattle", "西雅图"), c("us-portland", "Portland", "波特兰"),
        c("us-sandiego", "San Diego", "圣地亚哥"),
      ]},
      { id: "us-mountain", en: "Mountain / SW", zh: "山区 / 西南", cities: [
        c("us-denver", "Denver", "丹佛"), c("us-saltlake", "Salt Lake City", "盐湖城"),
        c("us-yosemite", "Yosemite", "优胜美地"), c("us-grandcanyon", "Grand Canyon", "大峡谷"),
        c("us-zion", "Zion", "锡安"), c("us-yellowstone", "Yellowstone", "黄石"),
        c("us-jackson", "Jackson Hole", "杰克逊洞"),
      ]},
      { id: "us-east", en: "East Coast", zh: "东海岸", cities: [
        c("us-nyc", "New York City", "纽约"), c("us-boston", "Boston", "波士顿"),
        c("us-dc", "Washington DC", "华盛顿"), c("us-miami", "Miami", "迈阿密"),
      ]},
      { id: "us-alaska", en: "Alaska", zh: "阿拉斯加", cities: [
        c("us-anchorage", "Anchorage", "安克雷奇"), c("us-denali", "Denali", "迪纳利"),
      ]},
      { id: "us-hawaii", en: "Hawaii", zh: "夏威夷", cities: [
        c("us-honolulu", "Honolulu", "檀香山"), c("us-maui", "Maui", "毛伊"),
        c("us-bigisland", "Big Island", "大岛"), c("us-kauai", "Kauai", "考艾岛"),
      ]},
    ],
  },
  {
    id: "ca", en: "Canada", zh: "加拿大", flag: "🇨🇦", continent: "Americas",
    regions: [
      { id: "ca-west", en: "West", zh: "西部", cities: [
        c("ca-vancouver", "Vancouver", "温哥华"), c("ca-banff", "Banff", "班夫"),
        c("ca-jasper", "Jasper", "贾斯珀"), c("ca-whistler", "Whistler", "惠斯勒"),
      ]},
      { id: "ca-east", en: "East", zh: "东部", cities: [
        c("ca-toronto", "Toronto", "多伦多"), c("ca-montreal", "Montréal", "蒙特利尔"),
        c("ca-quebec", "Québec City", "魁北克城"),
      ]},
      { id: "ca-north", en: "Yukon / NWT", zh: "育空 / 西北地区", cities: [
        c("ca-yellowknife", "Yellowknife", "黄刀镇"), c("ca-whitehorse", "Whitehorse", "白马市"),
      ]},
    ],
  },
  {
    id: "mx", en: "Mexico", zh: "墨西哥", flag: "🇲🇽", continent: "Americas",
    regions: [{ id: "mx-c", en: "Cities", zh: "城市", cities: [
      c("mx-cdmx", "Mexico City", "墨西哥城"), c("mx-cancun", "Cancún", "坎昆"),
      c("mx-tulum", "Tulum", "图卢姆"), c("mx-oaxaca", "Oaxaca", "瓦哈卡"),
    ]}],
  },
  {
    id: "ar", en: "Argentina", zh: "阿根廷", flag: "🇦🇷", continent: "Americas",
    regions: [
      { id: "ar-patagonia", en: "Patagonia", zh: "巴塔哥尼亚", cities: [
        c("ar-elcalafate", "El Calafate", "卡拉法特"), c("ar-elchalten", "El Chaltén", "查尔滕"),
        c("ar-ushuaia", "Ushuaia", "乌斯怀亚"), c("ar-bariloche", "Bariloche", "巴里洛切"),
      ]},
      { id: "ar-bsas", en: "Buenos Aires", zh: "布宜诺斯艾利斯", cities: [
        c("ar-bsas-c", "Buenos Aires", "布宜诺斯艾利斯"),
      ]},
      { id: "ar-mendoza", en: "Mendoza", zh: "门多萨", cities: [c("ar-mendoza-c", "Mendoza", "门多萨")] },
    ],
  },
  {
    id: "cl", en: "Chile", zh: "智利", flag: "🇨🇱", continent: "Americas",
    regions: [{ id: "cl-c", en: "Cities", zh: "城市", cities: [
      c("cl-santiago", "Santiago", "圣地亚哥"), c("cl-atacama", "Atacama", "阿塔卡马"),
      c("cl-torres", "Torres del Paine", "百内"), c("cl-easter", "Easter Island", "复活节岛"),
    ]}],
  },
  {
    id: "pe", en: "Peru", zh: "秘鲁", flag: "🇵🇪", continent: "Americas",
    regions: [{ id: "pe-c", en: "Cities", zh: "城市", cities: [
      c("pe-lima", "Lima", "利马"), c("pe-cusco", "Cusco", "库斯科"),
      c("pe-machu", "Machu Picchu", "马丘比丘"), c("pe-rainbow", "Rainbow Mountain", "彩虹山"),
    ]}],
  },
  {
    id: "br", en: "Brazil", zh: "巴西", flag: "🇧🇷", continent: "Americas",
    regions: [{ id: "br-c", en: "Cities", zh: "城市", cities: [
      c("br-rio", "Rio de Janeiro", "里约热内卢"), c("br-saopaulo", "São Paulo", "圣保罗"),
      c("br-iguazu", "Iguazu Falls", "伊瓜苏瀑布"), c("br-amazon", "Amazon (Manaus)", "亚马逊（玛瑙斯）"),
    ]}],
  },
  {
    id: "ec", en: "Ecuador", zh: "厄瓜多尔", flag: "🇪🇨", continent: "Americas",
    regions: [{ id: "ec-c", en: "Cities", zh: "城市", cities: [
      c("ec-quito", "Quito", "基多"), c("ec-galapagos", "Galápagos", "加拉帕戈斯"),
    ]}],
  },
  {
    id: "co", en: "Colombia", zh: "哥伦比亚", flag: "🇨🇴", continent: "Americas",
    regions: [{ id: "co-c", en: "Cities", zh: "城市", cities: [
      c("co-bogota", "Bogotá", "波哥大"), c("co-medellin", "Medellín", "麦德林"),
      c("co-cartagena", "Cartagena", "卡塔赫纳"),
    ]}],
  },
  {
    id: "cr", en: "Costa Rica", zh: "哥斯达黎加", flag: "🇨🇷", continent: "Americas",
    regions: [{ id: "cr-c", en: "Cities", zh: "城市", cities: [
      c("cr-sanjose", "San José", "圣何塞"), c("cr-arenal", "Arenal", "阿雷纳火山"),
      c("cr-monteverde", "Monteverde", "蒙特维多"),
    ]}],
  },

  /* ============== AFRICA ============== */
  {
    id: "ma", en: "Morocco", zh: "摩洛哥", flag: "🇲🇦", continent: "Africa",
    regions: [
      { id: "ma-imperial", en: "Imperial Cities", zh: "皇城", cities: [
        c("ma-marrakech", "Marrakech", "马拉喀什"), c("ma-fes", "Fes", "非斯"),
        c("ma-chefchaouen", "Chefchaouen", "舍夫沙万"), c("ma-rabat", "Rabat", "拉巴特"),
        c("ma-casablanca", "Casablanca", "卡萨布兰卡"),
      ]},
      { id: "ma-sahara", en: "Sahara", zh: "撒哈拉", cities: [
        c("ma-merzouga", "Merzouga", "梅尔祖卡"), c("ma-zagora", "Zagora", "扎戈拉"),
      ]},
      { id: "ma-coast", en: "Coast", zh: "海岸", cities: [
        c("ma-essaouira", "Essaouira", "索维拉"), c("ma-agadir", "Agadir", "阿加迪尔"),
      ]},
    ],
  },
  {
    id: "eg", en: "Egypt", zh: "埃及", flag: "🇪🇬", continent: "Africa",
    regions: [{ id: "eg-c", en: "Cities", zh: "城市", cities: [
      c("eg-cairo", "Cairo", "开罗"), c("eg-luxor", "Luxor", "卢克索"),
      c("eg-aswan", "Aswan", "阿斯旺"), c("eg-sharm", "Sharm el-Sheikh", "沙姆沙伊赫"),
    ]}],
  },
  {
    id: "tz", en: "Tanzania", zh: "坦桑尼亚", flag: "🇹🇿", continent: "Africa",
    regions: [{ id: "tz-c", en: "Cities & Parks", zh: "城市与公园", cities: [
      c("tz-arusha", "Arusha", "阿鲁沙"), c("tz-serengeti", "Serengeti", "塞伦盖蒂"),
      c("tz-kilimanjaro", "Kilimanjaro", "乞力马扎罗"), c("tz-zanzibar", "Zanzibar", "桑给巴尔"),
    ]}],
  },
  {
    id: "ke", en: "Kenya", zh: "肯尼亚", flag: "🇰🇪", continent: "Africa",
    regions: [{ id: "ke-c", en: "Cities & Parks", zh: "城市与公园", cities: [
      c("ke-nairobi", "Nairobi", "内罗毕"), c("ke-masai", "Maasai Mara", "马赛马拉"),
      c("ke-mombasa", "Mombasa", "蒙巴萨"),
    ]}],
  },
  {
    id: "za", en: "South Africa", zh: "南非", flag: "🇿🇦", continent: "Africa",
    regions: [{ id: "za-c", en: "Cities", zh: "城市", cities: [
      c("za-capetown", "Cape Town", "开普敦"), c("za-johannesburg", "Johannesburg", "约翰内斯堡"),
      c("za-kruger", "Kruger NP", "克鲁格国家公园"), c("za-garden", "Garden Route", "花园大道"),
    ]}],
  },
  {
    id: "na", en: "Namibia", zh: "纳米比亚", flag: "🇳🇦", continent: "Africa",
    regions: [{ id: "na-c", en: "Cities & Desert", zh: "城市与沙漠", cities: [
      c("na-windhoek", "Windhoek", "温得和克"), c("na-sossusvlei", "Sossusvlei", "索苏斯维利"),
      c("na-swakopmund", "Swakopmund", "斯瓦科普蒙德"),
    ]}],
  },

  /* ============== OCEANIA ============== */
  {
    id: "au", en: "Australia", zh: "澳大利亚", flag: "🇦🇺", continent: "Oceania",
    regions: [
      { id: "au-east", en: "East Coast", zh: "东海岸", cities: [
        c("au-sydney", "Sydney", "悉尼"), c("au-melbourne", "Melbourne", "墨尔本"),
        c("au-brisbane", "Brisbane", "布里斯班"), c("au-cairns", "Cairns", "凯恩斯"),
        c("au-gbr", "Great Barrier Reef", "大堡礁"),
      ]},
      { id: "au-west", en: "West Coast", zh: "西海岸", cities: [
        c("au-perth", "Perth", "珀斯"), c("au-broome", "Broome", "布鲁姆"),
      ]},
      { id: "au-outback", en: "Outback", zh: "内陆", cities: [
        c("au-uluru", "Uluru", "乌鲁鲁"), c("au-alicesprings", "Alice Springs", "爱丽斯泉"),
      ]},
      { id: "au-tas", en: "Tasmania", zh: "塔斯马尼亚", cities: [
        c("au-hobart", "Hobart", "霍巴特"), c("au-cradle", "Cradle Mountain", "摇篮山"),
      ]},
    ],
  },
  {
    id: "nz", en: "New Zealand", zh: "新西兰", flag: "🇳🇿", continent: "Oceania",
    regions: [
      { id: "nz-north", en: "North Island", zh: "北岛", cities: [
        c("nz-auckland", "Auckland", "奥克兰"), c("nz-rotorua", "Rotorua", "罗托鲁瓦"),
        c("nz-wellington", "Wellington", "惠灵顿"), c("nz-tongariro", "Tongariro", "汤加里罗"),
      ]},
      { id: "nz-south", en: "South Island", zh: "南岛", cities: [
        c("nz-queenstown", "Queenstown", "皇后镇"), c("nz-wanaka", "Wanaka", "瓦纳卡"),
        c("nz-milford", "Milford Sound", "米尔福德峡湾"), c("nz-christchurch", "Christchurch", "基督城"),
        c("nz-aoraki", "Aoraki / Mt. Cook", "库克山"),
      ]},
    ],
  },
  {
    id: "fj", en: "Fiji", zh: "斐济", flag: "🇫🇯", continent: "Oceania",
    regions: [{ id: "fj-c", en: "Islands", zh: "海岛", cities: [
      c("fj-nadi", "Nadi", "楠迪"), c("fj-mamanuca", "Mamanuca Is.", "玛玛努卡群岛"),
    ]}],
  },
];

export type SelectedDestination = {
  id: string;       // city id or country marker id
  countryId: string;
  regionId: string;
  cityEn: string;
  cityZh: string;
  countryFlag: string;
  kind?: "city" | "country";
};

// Continent ordering for the picker
export const continentOrder: Country["continent"][] = [
  "Asia", "Europe", "Americas", "Oceania", "Africa",
];

export const continentLabel: Record<Country["continent"], { en: string; zh: string }> = {
  Asia: { en: "Asia", zh: "亚洲" },
  Europe: { en: "Europe", zh: "欧洲" },
  Americas: { en: "Americas", zh: "美洲" },
  Africa: { en: "Africa", zh: "非洲" },
  Oceania: { en: "Oceania", zh: "大洋洲" },
};

// Fuzzy search across country / region / city. Country-name matches surface
// every city in that country so the user can drill in.
export function flattenSearch(query: string): SelectedDestination[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: SelectedDestination[] = [];
  const seen = new Set<string>();
  for (const co of destinationTree) {
    const countryHit = `${co.en} ${co.zh}`.toLowerCase().includes(q);
    for (const r of co.regions) {
      const regionHit = `${r.en} ${r.zh}`.toLowerCase().includes(q);
      for (const ci of r.cities) {
        const cityHit = `${ci.en} ${ci.zh}`.toLowerCase().includes(q);
        if (countryHit || regionHit || cityHit) {
          const entry: SelectedDestination = {
            id: ci.id, countryId: co.id, regionId: r.id,
            cityEn: ci.en, cityZh: ci.zh, countryFlag: co.flag, kind: "city",
          };
          if (!seen.has(entry.id)) {
            seen.add(entry.id);
            out.push(entry);
          }
        }
      }
    }
  }

  // Add global country-level matches (supports "country only" selection).
  for (const co of getGlobalCountries()) {
    const countryHit = `${co.en} ${co.zh}`.toLowerCase().includes(q);
    if (!countryHit) continue;
    const id = `country-${co.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      countryId: co.id,
      regionId: "country",
      cityEn: co.en,
      cityZh: co.zh,
      countryFlag: co.flag,
      kind: "country",
    });
  }

  return out.slice(0, 80);
}

export function formatDestinations(
  list: SelectedDestination[],
  lang: "en" | "zh" | "ja",
): string {
  if (list.length === 0) return "—";
  return list.map((d) => (lang === "zh" ? d.cityZh : d.cityEn)).join(" · ");
}

type GlobalCountry = {
  id: string;
  en: string;
  zh: string;
  flag: string;
};

const ISO_ALPHA2_CODES = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ",
  "CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO",
  "JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR",
  "MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO",
  "RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV",
  "TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"
] as const;

const flagFromIso2 = (iso2: string): string =>
  iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

let cachedGlobalCountries: GlobalCountry[] | null = null;
export function getGlobalCountries(): GlobalCountry[] {
  if (cachedGlobalCountries) return cachedGlobalCountries;
  const en = new Intl.DisplayNames(["en"], { type: "region" });
  const zh = new Intl.DisplayNames(["zh-Hans"], { type: "region" });
  cachedGlobalCountries = ISO_ALPHA2_CODES.map((code) => ({
    id: code.toLowerCase(),
    en: en.of(code) ?? code,
    zh: zh.of(code) ?? (en.of(code) ?? code),
    flag: flagFromIso2(code),
  })).sort((a, b) => a.en.localeCompare(b.en));
  return cachedGlobalCountries;
}
