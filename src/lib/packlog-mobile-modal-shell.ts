/**
 * Shared layout for custom modals (AnimatePresence + motion / plain div).
 * Mobile: bottom sheet. md+: centered modal.
 */
/** 勿在 scrim 上用 touch-none，否则会阻断子层表单/按钮的触控（移动端「点了没反应」）。 */
export const packlogModalScrim =
  "fixed inset-0 z-50 overscroll-none max-md:flex max-md:flex-col max-md:justify-end max-md:p-0 md:grid md:place-items-center md:p-3 lg:p-4";

/** Outer motion/form surface — mobile bottom sheet cap + rounded top. */
export const packlogModalSurface =
  "module corner-tick corner-tick-br relative w-full max-md:max-h-[90vh] max-md:rounded-t-xl max-md:rounded-b-none max-md:border-b-0";

/** Scroll body inside surface (below optional header chrome). */
export const packlogModalBodyScroll =
  "min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain";
