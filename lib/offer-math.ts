import type { Offer, Tier } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function tierFor(tiers: Tier[], qty: number): Tier {
  return [...tiers].reverse().find((t) => qty >= t.minQty) ?? tiers[0];
}

export function topTier(tiers: Tier[]): Tier {
  return tiers[tiers.length - 1];
}

export type OfferBreakdown = {
  poolQty: number; // others + mine if joined
  targetQty: number; // top tier min qty (40)
  currentTier: Tier; // tier at poolQty
  tierReached: boolean; // poolQty >= targetQty
  groupUnitPrice: number; // price at top tier: 38.68
  aloneTotal: number; // 8 x 42.50 = 340.00
  groupSubtotal: number; // 8 x 38.68 = 309.44
  grossSavings: number; // 30.56
  fee: number; // 10% of savings = 3.06
  total: number; // 312.50
  netSavings: number; // 27.50
};

/** All money on the offer screen comes from here. Group pricing is quoted at the top tier. */
export function computeOffer(offer: Offer, joined: boolean): OfferBreakdown {
  const poolQty = offer.othersCommittedQty + (joined ? offer.myMonthlyQty : 0);
  const top = topTier(offer.tiers);
  const groupUnitPrice = round2(offer.aloneUnitPrice * (1 - top.discountPct / 100));
  const aloneTotal = round2(offer.myMonthlyQty * offer.aloneUnitPrice);
  const groupSubtotal = round2(offer.myMonthlyQty * groupUnitPrice);
  const grossSavings = round2(aloneTotal - groupSubtotal);
  const fee = round2(grossSavings * (offer.feePctOfSavings / 100));
  const total = round2(groupSubtotal + fee);
  return {
    poolQty,
    targetQty: top.minQty,
    currentTier: tierFor(offer.tiers, poolQty),
    tierReached: poolQty >= top.minQty,
    groupUnitPrice,
    aloneTotal,
    groupSubtotal,
    grossSavings,
    fee,
    total,
    netSavings: round2(aloneTotal - total),
  };
}

export const money = (n: number, opts: { cents?: boolean } = {}) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents === false ? 0 : 2,
    maximumFractionDigits: opts.cents === false ? 0 : 2,
  });
