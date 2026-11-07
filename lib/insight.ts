import neighbors from "@/data/neighbors.json";
import offers from "@/data/offers.json";
import type { MatchGroup, MatchResult, Neighbor, Offer } from "./types";

export const ROSE_TEA = "Rose Tea Cafe";
export const FRYER_OIL_ID = "fryer-oil-35lb";

export const fryerOffer = (offers as Offer[]).find((o) => o.id === "fryer-oil")!;

export function distanceFor(restaurant: string): number | null {
  const n = (neighbors as Neighbor[]).find((x) => x.label === restaurant);
  return n ? n.distanceMi : null;
}

export type Insight = {
  group: MatchGroup; // fryer oil group, Rose Tea first, then by distance
  restaurantCount: number; // 5
  distinctNames: number; // 4
  discountPct: number; // 9 (from seed offer, never from the AI)
  pooledQty: number; // sum of monthlyQty across members (42)
};

/** Builds the "CoBuy noticed…" insight from a match result. Returns null if no fryer oil group. */
export function fryerOilInsight(match: MatchResult): Insight | null {
  const g = match.groups.find((x) => x.catalogId === FRYER_OIL_ID);
  if (!g) return null;
  const members = [...g.members].sort((a, b) => {
    if (a.restaurant === ROSE_TEA) return -1;
    if (b.restaurant === ROSE_TEA) return 1;
    return (distanceFor(a.restaurant) ?? 99) - (distanceFor(b.restaurant) ?? 99);
  });
  return {
    group: { ...g, members },
    restaurantCount: new Set(members.map((m) => m.restaurant)).size,
    distinctNames: new Set(members.map((m) => m.rawName.trim().toLowerCase())).size,
    discountPct: fryerOffer.tiers[fryerOffer.tiers.length - 1].discountPct,
    pooledQty: members.reduce((s, m) => s + m.monthlyQty, 0),
  };
}
