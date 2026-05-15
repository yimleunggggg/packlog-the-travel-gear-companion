import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { Container, ContainerType } from "@/lib/packlog-data";
import {
  packlogBtnPrimary,
  packlogBtnSm,
  packlogBtnTertiary,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  packlogModalBodyScroll,
  packlogModalScrim,
  packlogModalSurface,
} from "@/lib/packlog-mobile-modal-shell";

type Preset = {
  type: ContainerType;
  glyph: string;
  defaultName: string;
  defaultNameZh: string;
  capacityL: number;
  maxKg: number;
};

// Curated, real-world bag types — covers the user's enumerated cases:
// 托运行李箱、登机箱、随身包、登山包、洗漱包、相机包、化妆包、衣物等.
const PRESETS: Preset[] = [
  {
    type: "checked",
    glyph: "▣",
    defaultName: "Checked Suitcase",
    defaultNameZh: "托运行李箱",
    capacityL: 80,
    maxKg: 23,
  },
  {
    type: "carry",
    glyph: "▤",
    defaultName: "Carry-On",
    defaultNameZh: "登机箱",
    capacityL: 35,
    maxKg: 7,
  },
  {
    type: "personal",
    glyph: "◍",
    defaultName: "Personal Bag",
    defaultNameZh: "随身包",
    capacityL: 18,
    maxKg: 7,
  },
  {
    type: "daypack",
    glyph: "◊",
    defaultName: "City Daypack",
    defaultNameZh: "城市日用包",
    capacityL: 20,
    maxKg: 6,
  },
  {
    type: "hike",
    glyph: "▲",
    defaultName: "Hiking Pack",
    defaultNameZh: "登山包",
    capacityL: 55,
    maxKg: 16,
  },
  {
    type: "camera",
    glyph: "◉",
    defaultName: "Camera Bag",
    defaultNameZh: "相机包",
    capacityL: 12,
    maxKg: 6,
  },
  {
    type: "toiletry",
    glyph: "◐",
    defaultName: "Toiletry Pouch",
    defaultNameZh: "洗漱包",
    capacityL: 4,
    maxKg: 2,
  },
  {
    type: "makeup",
    glyph: "◑",
    defaultName: "Makeup Pouch",
    defaultNameZh: "化妆包",
    capacityL: 3,
    maxKg: 1,
  },
  {
    type: "tech",
    glyph: "◈",
    defaultName: "Tech Pouch",
    defaultNameZh: "数码配件包",
    capacityL: 3,
    maxKg: 2,
  },
  {
    type: "clothing",
    glyph: "◇",
    defaultName: "Clothing Cube",
    defaultNameZh: "衣物收纳袋",
    capacityL: 15,
    maxKg: 5,
  },
  {
    type: "custom",
    glyph: "◯",
    defaultName: "Custom",
    defaultNameZh: "自定义",
    capacityL: 10,
    maxKg: 5,
  },
];

export function AddContainerSheet({
  open,
  onClose,
  onCommit,
}: {
  open: boolean;
  onClose: () => void;
  onCommit: (draft: Omit<Container, "id" | "code" | "items">) => void;
}) {
  const { t, lang } = useI18n();
  const mdUp = useMediaQuery("(min-width: 768px)");
  const [picked, setPicked] = useState<Preset>(PRESETS[0]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number>(PRESETS[0].capacityL);
  const [maxKg, setMaxKg] = useState<number>(PRESETS[0].maxKg);

  const choose = (p: Preset) => {
    setPicked(p);
    setCapacity(p.capacityL);
    setMaxKg(p.maxKg);
    setName("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (lang === "zh" ? picked.defaultNameZh : picked.defaultName);
    const isZh = /[\u4e00-\u9fa5]/.test(finalName);
    onCommit({
      name: isZh ? picked.defaultName : finalName,
      nameZh: isZh ? finalName : picked.defaultNameZh,
      type: picked.type,
      capacityL: Math.max(1, capacity),
      maxKg: Math.max(1, maxKg),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn("scrim", packlogModalScrim)}
          onClick={onClose}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={mdUp ? { y: 20, opacity: 0 } : { y: "100%", opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={mdUp ? { y: 20, opacity: 0 } : { y: "100%", opacity: 1 }}
            transition={
              mdUp
                ? { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }
                : { type: "spring", damping: 30, stiffness: 320 }
            }
            className={cn(
              packlogModalSurface,
              "flex w-full flex-col overflow-hidden",
              "max-md:max-h-[90vh]",
              "md:max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] md:max-w-lg md:rounded-lg",
            )}
          >
            <SheetDragHandle />
            <div className="relative shrink-0 border-b border-border px-5 pb-3 pt-1 md:px-6 md:pt-3">
              <div className="pr-10">
                <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                  + {t("container.add.bag")}
                </div>
                <h3 className={cn("mt-1", packlogSectionTitle)}>{t("container.new.title")}</h3>
                {t("container.new.subtitle").trim() ? (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {t("container.new.subtitle")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-2 font-mono text-sm text-muted-foreground hover:text-foreground md:top-3"
                aria-label="close"
              >
                ✕
              </button>
            </div>

            <div className={cn(packlogModalBodyScroll, "space-y-4 px-5 py-4 md:px-6")}>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {PRESETS.map((p) => {
                  const active = picked.type === p.type;
                  return (
                    <button
                      type="button"
                      key={p.type}
                      onClick={() => choose(p)}
                      className={`flex items-center gap-2 rounded border px-2.5 py-2 text-left transition ${
                        active
                          ? "border-signal bg-signal-soft text-foreground"
                          : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                      }`}
                    >
                      <span className="font-mono text-base text-signal">{p.glyph}</span>
                      <span className="truncate font-mono text-[11px] tracking-[0.1em]">
                        {t(`container.type.${p.type}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  t("container.new.name") +
                  " · " +
                  (lang === "zh" ? picked.defaultNameZh : picked.defaultName)
                }
                className="w-full rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-[#C8956C] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded border border-border-strong bg-background px-2 py-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {t("container.new.capacity")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(+e.target.value)}
                    className="ml-auto w-16 bg-transparent text-right font-mono text-sm focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 rounded border border-border-strong bg-background px-2 py-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {t("container.new.max")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={maxKg}
                    onChange={(e) => setMaxKg(+e.target.value)}
                    className="ml-auto w-16 bg-transparent text-right font-mono text-sm focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3 md:px-6">
              <button
                type="button"
                onClick={onClose}
                className={cn(packlogBtnTertiary, "px-3 py-1 text-[10px]")}
              >
                {t("container.add.cancel")}
              </button>
              <button type="submit" className={cn(packlogBtnPrimary, packlogBtnSm)}>
                {t("container.new.commit")}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
