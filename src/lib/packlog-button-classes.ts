/**
 * G3 按钮三级：Primary 实心铜橙（非半透明 signal）；Secondary 描边同色；Tertiary 深棕字无填充。
 */
export const packlogBtnPrimary =
  "inline-flex items-center justify-center rounded-[10px] border border-[#C8956C] bg-[#C8956C] font-mono font-semibold tracking-[0.14em] text-white shadow-none transition hover:brightness-[1.03] active:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

export const packlogBtnSecondary =
  "inline-flex items-center justify-center rounded-[10px] border-[1.5px] border-[#C8956C] bg-transparent font-mono font-semibold tracking-[0.14em] text-[#C8956C] transition hover:bg-[#C8956C]/10 disabled:cursor-not-allowed disabled:opacity-40";

export const packlogBtnTertiary =
  "inline-flex items-center justify-center border-0 bg-transparent font-mono tracking-[0.18em] text-[#6B5234] underline-offset-4 hover:text-[#4a3824] hover:underline disabled:cursor-not-allowed disabled:opacity-40";

/** 小号 CTA（弹层、卡片内） */
export const packlogBtnSm = "min-h-0 px-3 py-1.5 text-[10px] tracking-[0.18em]";

/** 全宽主操作（行程简报、打包页底栏） */
export const packlogBtnBlock =
  "min-h-[var(--touch-target)] w-full px-4 py-2.5 text-center text-[11px] tracking-[0.2em] sm:w-auto sm:min-w-[10rem]";

/** 页面级大标题（F1：移动端 24px / 桌面 28px） */
export const packlogPageTitle =
  "font-display font-bold tracking-tight text-foreground [font-size:var(--font-page-title-size)] [font-weight:var(--font-page-title-weight)] [line-height:var(--font-page-title-leading)]";

/** 区块标题（F1：移动端 17px / 桌面沿用变量） */
export const packlogSectionTitle =
  "font-display text-foreground [font-size:var(--font-section-title-size)] [font-weight:var(--font-section-title-weight)] [line-height:var(--font-section-title-leading)]";

/** 清单物品名（F1 · 15px / 500） */
export const packlogItemName =
  "text-foreground [font-size:var(--font-item-name-size)] [font-weight:var(--font-item-name-weight)] [line-height:var(--font-item-name-leading)]";

/** 数量 / 重量 mono（F1 · 14px JetBrains） */
export const packlogItemWeight =
  "tabular-nums [font-family:var(--font-weight-number-family)] [font-size:var(--font-weight-number-size)] [font-weight:var(--font-weight-number-weight)] text-[var(--text-secondary)]";

/** 辅助标签（F1 · 12px） */
export const packlogLabel =
  "[font-size:var(--font-label-size)] [font-weight:var(--font-label-weight)] text-[var(--text-secondary)]";

/** 说明 / 提示（F1 hint） */
export const packlogHint =
  "[font-size:var(--font-hint-size)] [font-weight:var(--font-hint-weight)] leading-relaxed text-[var(--text-tertiary)]";
