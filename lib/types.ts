import { z } from "zod";

/* ---------- AI feature 1: invoice extraction ---------- */

export const LineItemSchema = z.object({
  rawName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const ExtractResultSchema = z.object({
  supplier: z.string(),
  invoiceDate: z.string(), // ISO yyyy-mm-dd preferred
  lineItems: z.array(LineItemSchema).min(1),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;

/* ---------- AI feature 2: equivalence matching ---------- */

export const MatchMemberSchema = z.object({
  restaurant: z.string(), // exactly "Rose Tea Cafe" or a neighbor label like "Restaurant A"
  rawName: z.string(),
  monthlyQty: z.number(),
  reason: z.string(), // one sentence
  confidence: z.number().min(0).max(1),
});
export type MatchMember = z.infer<typeof MatchMemberSchema>;

export const MatchGroupSchema = z.object({
  catalogId: z.string().nullable(), // null = items that matched no catalog product
  members: z.array(MatchMemberSchema),
});
export type MatchGroup = z.infer<typeof MatchGroupSchema>;

export const MatchResultSchema = z.object({
  groups: z.array(MatchGroupSchema),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

/* ---------- API envelopes ----------
 * POST /api/extract  multipart/form-data, field "file" (PNG/JPG)
 * POST /api/match    JSON { lineItems: LineItem[] }   (server loads neighbors + catalog itself)
 * Both accept header "x-use-cache: 1" to force the cached response.
 * Both ALWAYS return 200 with an envelope (falling back to cache on any failure).
 */
export type AiSource = "live" | "cached" | "fallback";
// live = real model call succeeded; cached = toggle was on; fallback = live failed, cache used

export type ApiEnvelope<T> = {
  data: T;
  source: AiSource;
  model?: string; // model id used when live
  ms: number; // server-side duration
  note?: string; // why fallback happened, for the console / a tiny debug label
};

export const MatchRequestSchema = z.object({
  lineItems: z.array(LineItemSchema).min(1),
});

/* ---------- Seed data shapes (/data/*.json) ---------- */

export type CatalogProduct = {
  id: string;
  name: string;
  packSize: string;
  category: string;
  description: string;
};

export type NeighborLineItem = {
  rawName: string;
  monthlyQty: number;
  unit: string;
  unitPrice: number;
};

export type Neighbor = {
  label: string; // "Restaurant A" (anonymous)
  distanceMi: number;
  cuisine: string;
  lineItems: NeighborLineItem[];
};

export type Tier = { minQty: number; discountPct: number };

export type Offer = {
  id: string;
  catalogId: string;
  productName: string;
  packSize: string;
  unitLabel: string; // "jug"
  supplier: string;
  aloneUnitPrice: number;
  tiers: Tier[]; // ascending by minQty
  myMonthlyQty: number; // Rose Tea's quantity
  othersCommittedQty: number; // before Rose Tea joins
  othersCount: number; // committed restaurants other than Rose Tea
  feePctOfSavings: number; // 10
  deadline: string; // human readable, e.g. "Closes Thu, Nov 12"
  nextDelivery: string; // e.g. "Mon, Nov 16"
  pickupLocation: string;
};
