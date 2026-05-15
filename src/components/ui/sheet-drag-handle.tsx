import { cn } from "@/lib/utils";

/** iOS-style grabber for bottom sheets (mobile). */
export function SheetDragHandle({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 justify-center pt-2 md:hidden", className)} aria-hidden>
      <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
    </div>
  );
}
