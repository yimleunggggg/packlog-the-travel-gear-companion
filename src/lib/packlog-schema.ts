import { z } from "zod";

export const itemStatusSchema = z.enum(["todo", "packed"]);
export const reviewVerdictSchema = z.enum(["keep", "drop", "upgrade"]).nullable();
export const ownershipSchema = z.enum(["owned", "wishlist", "borrowed", "undecided"]);

export const itemCategorySchema = z.enum(["tech", "apparel", "doc", "health", "optic", "misc"]);

export const weightSourceSchema = z.enum([
  "library",
  "spec",
  "user",
  "ai_estimate",
  "community_median",
]);

export const packSystemGroupSchema = z.enum([
  "shelter",
  "sleep_system",
  "cooking",
  "nav_safety",
  "movement",
  "main_pack",
  "resupply",
  "apparel_layer",
  "uncategorized",
]);

export const itemSchema = z.object({
  id: z.string().min(1),
  gearId: z.string().nullable(),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  nameZh: z.string().optional(),
  qty: z.number().int().min(1),
  weightG: z.number().min(0),
  weightSource: weightSourceSchema.optional(),
  weightEstimateLowG: z.number().min(0).optional(),
  weightEstimateHighG: z.number().min(0).optional(),
  communityMedianSampleCount: z.number().int().min(1).optional(),
  category: itemCategorySchema,
  status: itemStatusSchema,
  verdict: reviewVerdictSchema,
  utility: z.number().int().min(1).max(5).nullable(),
  ownership: ownershipSchema,
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  note: z.string().optional(),
  isWorn: z.boolean().optional(),
  isConsumable: z.boolean().optional(),
  systemGroup: packSystemGroupSchema.optional(),
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

const tripSchemaBase = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  destinations: z.array(selectedDestinationSchema),
  days: z.number().int().positive(),
  startDate: z.string().min(1),
  climate: z.string().min(1),
  scenario: scenarioSchema,
  scenarios: z.array(scenarioSchema).min(1),
  phase: lifecyclePhaseSchema,
  containers: z.array(containerSchema),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  dismissedScenarioSeeds: z.array(z.string()).optional(),
});

/** Legacy JSON may only have `scenario` — derive `scenarios: [scenario]` and sync primary. */
export const tripSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const o = { ...(raw as Record<string, unknown>) };
  const multi = o.scenarios;
  const primary = o.scenario;
  if (Array.isArray(multi) && multi.length > 0) {
    o.scenarios = multi;
    o.scenario = multi[0];
  } else if (primary != null && typeof primary === "string") {
    o.scenarios = [primary];
    o.scenario = primary;
  }
  return o;
}, tripSchemaBase);

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
  sku: z.string().optional(),
  weightG: z.number().min(0),
  category: itemCategorySchema,
  description: z.string(),
  descriptionZh: z.string().optional(),
  ownedSince: z.string().min(1),
  ownership: ownershipSchema,
  history: z.array(gearReviewSchema),
  kits: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  catalogProductId: z.string().optional(),
});

export const packlogSnapshotVersion = 1 as const;

export const packlogSnapshotSchema = z.object({
  version: z.literal(packlogSnapshotVersion),
  updatedAt: z.string().datetime(),
  trips: z.array(tripSchema),
  library: z.array(gearSpecSchema),
});

export type PacklogSnapshot = z.infer<typeof packlogSnapshotSchema>;
