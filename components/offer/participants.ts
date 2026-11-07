import neighbors from "@/data/neighbors.json";
import type { Neighbor } from "@/lib/types";

export type Participant = { label: string; qty: number; distanceMi: number };

/** Neighbors' committed fryer oil quantities, read from the neighbor seed (each names it differently). */
const FRYER_OIL = /fry|canola/i;

export const fryerParticipants: Participant[] = (neighbors as Neighbor[])
  .map((n) => {
    const item = n.lineItems.find((li) => FRYER_OIL.test(li.rawName));
    return item ? { label: n.label, qty: item.monthlyQty, distanceMi: n.distanceMi } : null;
  })
  .filter((p): p is Participant => p !== null);
