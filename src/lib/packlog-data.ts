export type ItemStatus = "todo" | "packed";
export type ReviewVerdict = "keep" | "drop" | "upgrade" | null;

export type Item = {
  id: string;
  name: string;
  qty: number;
  weightG: number;
  category: "tech" | "apparel" | "doc" | "health" | "optic" | "misc";
  status: ItemStatus;
  verdict: ReviewVerdict;
  note?: string;
};

export type Container = {
  id: string;
  code: string;        // SKU-like code
  name: string;
  type: "checked" | "carry" | "camera" | "personal";
  capacityL: number;
  maxKg: number;
  items: Item[];
};

export type LifecyclePhase = "PLAN" | "PACK" | "REVIEW";

export type Trip = {
  id: string;
  title: string;
  destination: string;
  days: number;
  startDate: string;
  climate: string;
  phase: LifecyclePhase;
  containers: Container[];
};

export const tripData: Trip = {
  id: "TRP-0421",
  title: "Hokkaido / Winter Recon",
  destination: "Sapporo → Furano → Otaru",
  days: 7,
  startDate: "2026.05.02",
  climate: "−8°C ↔ 3°C  /  Snow",
  phase: "PACK",
  containers: [
    {
      id: "c1",
      code: "C-01",
      name: "Checked Duffel",
      type: "checked",
      capacityL: 80,
      maxKg: 23,
      items: [
        { id: "i1", name: "Down Parka 800FP", qty: 1, weightG: 720, category: "apparel", status: "packed", verdict: null },
        { id: "i2", name: "Merino Baselayer", qty: 3, weightG: 210, category: "apparel", status: "packed", verdict: null },
        { id: "i3", name: "Insulated Pants", qty: 1, weightG: 480, category: "apparel", status: "packed", verdict: null },
        { id: "i4", name: "Gore-Tex Shell", qty: 1, weightG: 540, category: "apparel", status: "todo", verdict: null },
        { id: "i5", name: "Snow Boots Sz.42", qty: 1, weightG: 1280, category: "apparel", status: "packed", verdict: null },
        { id: "i6", name: "Toiletry Pouch", qty: 1, weightG: 380, category: "health", status: "todo", verdict: null },
        { id: "i7", name: "Spare Cables Kit", qty: 1, weightG: 220, category: "tech", status: "todo", verdict: null },
      ],
    },
    {
      id: "c2",
      code: "C-02",
      name: "Camera Sling",
      type: "camera",
      capacityL: 12,
      maxKg: 6,
      items: [
        { id: "i8", name: "Leica Q3", qty: 1, weightG: 743, category: "optic", status: "packed", verdict: null },
        { id: "i9", name: "ND Filter 64", qty: 1, weightG: 38, category: "optic", status: "packed", verdict: null },
        { id: "i10", name: "Spare Battery BP-SCL6", qty: 2, weightG: 86, category: "optic", status: "packed", verdict: null },
        { id: "i11", name: "SD V90 128GB", qty: 2, weightG: 4, category: "optic", status: "todo", verdict: null },
        { id: "i12", name: "Lens Cloth", qty: 1, weightG: 6, category: "optic", status: "packed", verdict: null },
      ],
    },
    {
      id: "c3",
      code: "C-03",
      name: "Personal Carry",
      type: "personal",
      capacityL: 18,
      maxKg: 7,
      items: [
        { id: "i13", name: "Passport + JP Visa", qty: 1, weightG: 60, category: "doc", status: "packed", verdict: null },
        { id: "i14", name: "MacBook Air 13", qty: 1, weightG: 1240, category: "tech", status: "packed", verdict: null },
        { id: "i15", name: "AirPods Pro", qty: 1, weightG: 50, category: "tech", status: "packed", verdict: null },
        { id: "i16", name: "Eye Mask + Earplugs", qty: 1, weightG: 30, category: "health", status: "todo", verdict: null },
        { id: "i17", name: "Travel Wallet", qty: 1, weightG: 110, category: "doc", status: "packed", verdict: null },
        { id: "i18", name: "Hand Warmer ×4", qty: 4, weightG: 80, category: "misc", status: "todo", verdict: null },
      ],
    },
  ],
};

// Past trip with review verdicts
export const reviewTrip = {
  id: "TRP-0319",
  title: "Patagonia / Torres del Paine",
  date: "2025.11",
  verdicts: [
    { name: "Down Parka 800FP", verdict: "keep" as const, note: "Saved my life on Day 3. MVP." },
    { name: "Trail Runners", verdict: "upgrade" as const, note: "Soles destroyed. Need GTX next." },
    { name: "Travel Pillow", verdict: "drop" as const, note: "Never used. Dead weight 320g." },
    { name: "Power Bank 20K", verdict: "keep" as const, note: "Carried 2 phones + camera." },
    { name: "Paper Map", verdict: "drop" as const, note: "Phone offline maps sufficed." },
    { name: "Leica Q3", verdict: "keep" as const, note: "Single best decision." },
  ],
};

export const communityTemplates = [
  {
    id: "t1",
    author: "@kenji_walks",
    rating: 4.8,
    cloned: 1284,
    title: "Tokyo / 5D Street Photo",
    climate: "Mild · 12-22°C",
    items: 24,
    weight: "8.4kg",
    tags: ["camera", "minimal", "city"],
  },
  {
    id: "t2",
    author: "@alpine.maria",
    rating: 4.9,
    cloned: 873,
    title: "Iceland Ring Road / 10D",
    climate: "Cold · -2-8°C",
    items: 41,
    weight: "18.2kg",
    tags: ["self-drive", "outdoor", "rain"],
  },
  {
    id: "t3",
    author: "@nomad.sayuri",
    rating: 4.7,
    cloned: 612,
    title: "Bali Workation / 21D",
    climate: "Tropical · 26-32°C",
    items: 32,
    weight: "11.5kg",
    tags: ["remote-work", "long-stay"],
  },
];
