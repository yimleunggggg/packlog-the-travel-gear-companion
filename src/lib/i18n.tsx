import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "zh" | "ja";

type Dict = Record<string, string>;

const dicts: Record<Lang, Dict> = {
  en: {
    "brand.tagline": "GEAR · LIFECYCLE · LOG",
    "lifecycle": "LIFECYCLE",
    "phase.PLAN": "PLAN",
    "phase.PACK": "PACK",
    "phase.REVIEW": "REVIEW",
    "lang.label": "LANG",

    "brief.file": "FILE",
    "brief.subtitle": "Your gear is being professionally taken over. Breathe.",
    "brief.cta.continue": "▸ CONTINUE PACKING",
    "brief.cta.clone": "CLONE FROM COMMUNITY",
    "brief.cta.export": "EXPORT MANIFEST",
    "brief.stat.items": "ITEMS",
    "brief.stat.mass": "MASS",
    "brief.stat.bags": "BAGS",
    "brief.stat.dep": "DEP-T",
    "brief.load": "LOAD PROGRESS",
    "brief.tape.brief": "MISSION BRIEF",
    "brief.tape.dep": "DEP",
    "brief.tape.dur": "DURATION",
    "brief.tape.status": "STATUS",
    "brief.days": "days",

    "container.collapse": "─ COLLAPSE",
    "container.expand": "+ EXPAND",
    "container.add": "+ ADD GEAR",
    "container.add.name": "Item name",
    "container.add.qty": "Qty",
    "container.add.weight": "Weight (g)",
    "container.add.suggest": "Suggested weights based on a curated reference library (avg of common spec / measured samples).",
    "container.add.commit": "ADD",
    "container.add.cancel": "CANCEL",
    "container.gauge.mass": "MASS",
    "container.gauge.packed": "PACKED",
    "container.type.checked": "CHECKED",
    "container.type.carry": "CARRY-ON",
    "container.type.camera": "OPTICAL",
    "container.type.personal": "PERSONAL",

    "param.distribution": "◇ MASS · DISTRIBUTION",
    "param.kg": "KG TOTAL",
    "param.assist": "⚙ AUTO · ASSIST",
    "param.assist.1": "Hokkaido in May → +2 hand warmers suggested",
    "param.assist.2": "Carry-on at 6.4/7kg → safe for ANA",
    "param.assist.3": "Missing: travel adapter (Type-A, JP)",
    "param.suggest": "◆ SMART · SUGGEST",
    "param.suggest.tip": "Tap any row to add directly into the matching container.",
    "param.suggest.add": "+ ADD",

    "cat.tech": "TECH",
    "cat.apparel": "APPAREL",
    "cat.doc": "DOCS",
    "cat.health": "HEALTH",
    "cat.optic": "OPTICAL",
    "cat.misc": "MISC",

    "community.head": "◐ COMMUNITY · BLUEPRINT",
    "community.title": "Clone someone’s homework.",
    "community.clone": "⤓ CLONE → MERGE",
    "community.items": "items",

    "review.head": "⟲ POST-TRIP · DEBRIEF",
    "review.last": "Last mission",
    "review.sealed": "sealed",
    "review.verdicts": "verdicts",
    "review.openLog": "OPEN FULL LOG",
    "review.dna": "◆ GEAR-DNA · INSIGHT",
    "review.dna.text": "Across 12 sealed trips, your highest-rated category is OPTICAL (avg 4.7). You drop paper-based items 83% of the time. Suggestion for next pack: skip the journal, bring the ND filter.",

    "footer.doc": "DOC-ID",
    "footer.build": "BUILD",
    "footer.encoding": "ENCODING",
    "footer.signed": "SIGNED",
  },
  zh: {
    "brand.tagline": "装备 · 生命周期 · 日志",
    "lifecycle": "生命周期",
    "phase.PLAN": "筹备",
    "phase.PACK": "打包",
    "phase.REVIEW": "复盘",
    "lang.label": "语言",

    "brief.file": "档案",
    "brief.subtitle": "你的装备正在被专业接管。深呼吸。",
    "brief.cta.continue": "▸ 继续打包",
    "brief.cta.clone": "从社区克隆",
    "brief.cta.export": "导出清单",
    "brief.stat.items": "物品",
    "brief.stat.mass": "总重",
    "brief.stat.bags": "行李",
    "brief.stat.dep": "倒计时",
    "brief.load": "装载进度",
    "brief.tape.brief": "任务简报",
    "brief.tape.dep": "出发",
    "brief.tape.dur": "时长",
    "brief.tape.status": "状态",
    "brief.days": "天",

    "container.collapse": "─ 收起",
    "container.expand": "+ 展开",
    "container.add": "+ 添加装备",
    "container.add.name": "物品名称",
    "container.add.qty": "数量",
    "container.add.weight": "重量 (克)",
    "container.add.suggest": "重量来自精选参考库（常见规格/实测样本平均值），可手动覆盖。",
    "container.add.commit": "添加",
    "container.add.cancel": "取消",
    "container.gauge.mass": "重量",
    "container.gauge.packed": "已打包",
    "container.type.checked": "托运",
    "container.type.carry": "随身",
    "container.type.camera": "摄影",
    "container.type.personal": "个人",

    "param.distribution": "◇ 重量 · 分布",
    "param.kg": "公斤合计",
    "param.assist": "⚙ 自动 · 辅助",
    "param.assist.1": "5月北海道 → 建议 +2 暖宝宝",
    "param.assist.2": "随身 6.4/7kg → ANA 合规",
    "param.assist.3": "缺少：日规 Type-A 转换插头",
    "param.suggest": "◆ 智能 · 建议",
    "param.suggest.tip": "点击任意一行可直接加入对应容器。",
    "param.suggest.add": "+ 加入",

    "cat.tech": "数码",
    "cat.apparel": "服装",
    "cat.doc": "证件",
    "cat.health": "健康",
    "cat.optic": "光学",
    "cat.misc": "杂项",

    "community.head": "◐ 社区 · 蓝图",
    "community.title": "抄一份别人的作业。",
    "community.clone": "⤓ 克隆 → 合并",
    "community.items": "件",

    "review.head": "⟲ 行后 · 复盘",
    "review.last": "上次任务",
    "review.sealed": "已封存",
    "review.verdicts": "条评价",
    "review.openLog": "查看完整日志",
    "review.dna": "◆ 装备-DNA · 洞察",
    "review.dna.text": "在已封存的 12 次行程里，你评分最高的品类是「光学」（均 4.7）。纸质物品被淘汰的频率达 83%。下次建议：放下笔记本，带上 ND 滤镜。",

    "footer.doc": "档案号",
    "footer.build": "版本",
    "footer.encoding": "编码",
    "footer.signed": "签发",
  },
  ja: {
    "brand.tagline": "ギア · ライフサイクル · ログ",
    "lifecycle": "ライフサイクル",
    "phase.PLAN": "計画",
    "phase.PACK": "梱包",
    "phase.REVIEW": "振返",
    "lang.label": "言語",

    "brief.file": "ファイル",
    "brief.subtitle": "あなたの装備はプロに引き継がれています。深呼吸を。",
    "brief.cta.continue": "▸ 梱包を続ける",
    "brief.cta.clone": "コミュニティから複製",
    "brief.cta.export": "マニフェスト出力",
    "brief.stat.items": "アイテム",
    "brief.stat.mass": "総重量",
    "brief.stat.bags": "バッグ",
    "brief.stat.dep": "出発まで",
    "brief.load": "積載進捗",
    "brief.tape.brief": "ミッション概要",
    "brief.tape.dep": "出発",
    "brief.tape.dur": "期間",
    "brief.tape.status": "状態",
    "brief.days": "日",

    "container.collapse": "─ 収納",
    "container.expand": "+ 展開",
    "container.add": "+ ギアを追加",
    "container.add.name": "アイテム名",
    "container.add.qty": "数",
    "container.add.weight": "重量 (g)",
    "container.add.suggest": "重量は参考ライブラリ（一般仕様/実測平均）から提案。手動で上書き可能。",
    "container.add.commit": "追加",
    "container.add.cancel": "キャンセル",
    "container.gauge.mass": "重量",
    "container.gauge.packed": "梱包済",
    "container.type.checked": "預け荷物",
    "container.type.carry": "機内持込",
    "container.type.camera": "撮影機材",
    "container.type.personal": "パーソナル",

    "param.distribution": "◇ 重量 · 分布",
    "param.kg": "KG 合計",
    "param.assist": "⚙ 自動 · アシスト",
    "param.assist.1": "5月の北海道 → カイロ +2 推奨",
    "param.assist.2": "機内 6.4/7kg → ANA 適合",
    "param.assist.3": "不足: 日本仕様 Type-A 変換プラグ",
    "param.suggest": "◆ スマート · 提案",
    "param.suggest.tip": "行をタップで対応コンテナに直接追加。",
    "param.suggest.add": "+ 追加",

    "cat.tech": "テック",
    "cat.apparel": "アパレル",
    "cat.doc": "書類",
    "cat.health": "ヘルス",
    "cat.optic": "光学",
    "cat.misc": "その他",

    "community.head": "◐ コミュニティ · ブループリント",
    "community.title": "誰かの宿題を写そう。",
    "community.clone": "⤓ 複製 → マージ",
    "community.items": "点",

    "review.head": "⟲ ポストトリップ · デブリーフ",
    "review.last": "前回のミッション",
    "review.sealed": "封印済み",
    "review.verdicts": "件の判定",
    "review.openLog": "ログを開く",
    "review.dna": "◆ ギア-DNA · インサイト",
    "review.dna.text": "封印された12回の旅で、最高評価カテゴリは「光学」(平均4.7)。紙ベースのアイテムは83%の確率で除外されています。次の提案：ノートを置き、NDフィルターを携行。",

    "footer.doc": "DOC-ID",
    "footer.build": "BUILD",
    "footer.encoding": "ENCODING",
    "footer.signed": "SIGNED",
  },
};

const Ctx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      (localStorage.getItem("packlog.lang") as Lang | null)) || null;
    if (saved && dicts[saved]) setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("packlog.lang", lang);
  }, [lang]);

  const t = (k: string) => dicts[lang][k] ?? dicts.en[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
