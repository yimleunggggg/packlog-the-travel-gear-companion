import type { Item } from "@/lib/packlog-data";

/** PACKLOG-SPEC §3.4 — 打包页顶栏筛选 */
export type PackViewFilter = "all" | "todo" | "packed" | "wishlist";

export function itemMatchesPackViewFilter(item: Item, f: PackViewFilter): boolean {
  if (f === "all") return true;
  if (f === "todo") return item.status !== "packed";
  if (f === "packed") return item.status === "packed";
  return item.ownership === "wishlist";
}
