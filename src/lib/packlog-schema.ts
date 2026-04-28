import { z } from "zod";

export const itemStatusSchema = z.enum(["todo", "packed"]);
export const reviewVerdictSchema = z.enum(["keep", "drop", "upgrade"]).nullable();
export const ownershipSchema = z.enum(["owned", "wishlist", "undecided"]);

export const itemCategorySchema = z.enum([
  "tech",
  "apparel",
  "doc",
  "health",
  "optic",
  "misc",
]);

export const itemSchema = z.object({
  id: z.string().min(1),
  gearId: z.string().nullable(),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  nameZh: z.string().optional(),
  qty: z.number().int().min(1),
  weightG: z.number().min(0),
  weightSource: z.enum(["library", "user", "spec"]).optional(),
  category: itemCategorySchema,
  status: itemStatusSchema,
  verdict: reviewVerdictSchema,
  utility: z.number().int().min(1).max(5).nullable(),
  ownership: ownershipSchema,
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  note: z.string().optional(),
});

export const containerTypeSchema = z.enum([
  "checked",
  "carry",
  "personal",
  "daypack",
  "hike",
  "camera",
  "toiletry",
  "makeup",
  "tech",
  "clothing",
  "custom",
]);

export const containerSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  nameZh: z.string().optional(),
  type: containerTypeSchema,
  capacityL: z.number().min(0),
  maxKg: z.number().min(0),
  items: z.array(itemSchema),
});

export const selectedDestinationSchema = z.object({
  id: z.string().min(1),
  countryId: z.string().min(1),
  regionId: z.string().min(1),
  cityEn: z.string().min(1),
  cityZh: z.string().min(1),
  countryFlag: z.string().min(1),
});

export const lifecyclePhaseSchema = z.enum(["PACK", "REVIEW"]);

export const scenarioSchema = z.enum([
  "winter-city",
  "summer-beach",
  "trail-run",
  "alpine",
  "desert",
  "workation",
  "ski",
  "dive",
  "general",
]);

export const tripSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  destinations: z.array(selectedDestinationSchema),
  days: z.number().int().positive(),
  startDate: z.string().min(1),
  climate: z.string().min(1),
  scenario: scenarioSchema,
  phase: lifecyclePhaseSchema,
  containers: z.array(containerSchema),
});

export const gearReviewSchema = z.object({
  tripId: z.string().min(1),
  tripTitle: z.string().min(1),
  date: z.string().min(1),
  verdict: z.enum(["keep", "drop", "upgrade"]),
  utility: z.number().int().min(1).max(5),
  note: z.string(),
});

export const gearSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  nameZh: z.string().optional(),
  brand: z.string().optional(),
  weightG: z.number().min(0),
  category: itemCategorySchema,
  description: z.string(),
  descriptionZh: z.string().optional(),
  ownedSince: z.string().min(1),
  ownership: ownershipSchema,
  history: z.array(gearReviewSchema),
});

export const packlogSnapshotVersion = 1 as const;

export const packlogSnapshotSchema = z.object({
  version: z.literal(packlogSnapshotVersion),
  updatedAt: z.string().datetime(),
  trips: z.array(tripSchema),
  library: z.array(gearSpecSchema),
});

export type PacklogSnapshot = z.infer<typeof packlogSnapshotSchema>;
