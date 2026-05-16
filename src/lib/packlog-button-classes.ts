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

/** 全宽主操作（行程简报、打包页底栏）— 移动端全宽触控；桌面紧凑宽度 */
export const packlogBtnBlock =
  "min-h-[var(--touch-target)] w-full px-4 py-2.5 text-center text-[11px] tracking-[0.2em] md:min-h-0 md:w-auto md:min-w-[10rem] md:py-2 md:text-[10px]";

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

/**
 * F2 · 数据密集体（装备库、社区统计等）— 与 `styles.css` :root 变量配套。
 * 辅文不小于 12px（--font-card-mono-size），段正文 15px→14px（md）。
 */
export const packlogKicker =
  "font-mono text-[var(--text-secondary)] [font-size:var(--font-kicker-size)] [font-weight:var(--font-kicker-weight)] [letter-spacing:var(--font-kicker-tracking)]";

export const packlogProseCompact =
  "text-pretty text-foreground/90 [font-size:var(--font-prose-compact-size)] [font-weight:400] [line-height:var(--font-prose-compact-leading)]";

export const packlogCardMono =
  "font-mono text-[var(--text-secondary)] [font-size:var(--font-card-mono-size)] [line-height:var(--font-card-mono-leading)]";

/** 类目标题（卡片首行，与 F1 meta 尺寸对齐） */
export const packlogCatTitle =
  "font-sans font-semibold text-foreground [font-size:var(--font-item-meta-size)] [line-height:var(--font-item-meta-leading)]";

/** 表单控件标签（sans · 与 meta 同阶，保证可读） */
export const packlogFieldLabel =
  "mb-1.5 block font-sans font-medium leading-snug text-foreground [font-size:var(--font-item-meta-size)]";
