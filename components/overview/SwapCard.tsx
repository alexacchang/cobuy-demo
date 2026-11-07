"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";

type Swap = { title: string; message: string; variants: { restaurant: string; rawName: string }[]; recommended: string };

export function SwapCard({ swap }: { swap: Swap }) {
  const [proposed, setProposed] = useState(false);
  return (
    <Card className="border-l-4 border-l-mint">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge tone="mint">CoBuy suggests</Badge>
      </div>
      <h3 className="text-xl font-semibold leading-snug text-ink">{swap.title}</h3>
      <p className="mt-1 text-base text-muted">{swap.message}</p>
      <ul className="mt-4 space-y-1.5">
        {swap.variants.map((v) => (
          <li key={v.restaurant} className="flex items-baseline gap-3 text-[15px]">
            <span className="w-28 shrink-0 font-medium text-muted">{v.restaurant}</span>
            <span className="font-mono text-ink">{v.rawName}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-mint-soft px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-green">Recommended</div>
          <div className="font-semibold text-ink">{swap.recommended}</div>
        </div>
        <Button onClick={() => setProposed(true)} disabled={proposed} className={proposed ? "!opacity-100 bg-card !text-green border border-green" : ""}>
          {proposed ? "Proposed" : "Propose swap"}
        </Button>
      </div>
    </Card>
  );
}
