"use client";
import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import PoolProgress from "@/components/offer/PoolProgress";
import DeliveryChoice from "@/components/offer/DeliveryChoice";
import CostBreakdown from "@/components/offer/CostBreakdown";
import { useDemo } from "@/lib/demo-store";
import { fryerOffer as offer } from "@/lib/insight";
import { computeOffer, money } from "@/lib/offer-math";

export default function OfferPage() {
  const { joined, delivery, set } = useDemo();
  const b = computeOffer(offer, joined);
  const top = offer.tiers[offer.tiers.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Group offer"
        title={`${offer.productName} · ${offer.packSize}`}
        subtitle={`From ${offer.supplier}`}
        right={<Badge tone="amber" className="px-4 py-2 text-base">{offer.deadline}</Badge>}
      />

      {/* Price comparison */}
      <Card className="mb-6 flex items-center gap-12 p-8">
        <div>
          <div className="text-base font-medium text-muted">Buying alone</div>
          <div className="num font-display mt-1 text-4xl font-semibold text-muted">
            <span className="line-through decoration-2">{money(offer.aloneUnitPrice)}</span>
            <span className="text-xl font-medium">/{offer.unitLabel}</span>
          </div>
        </div>
        <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden className="text-muted">
          <path d="M2 12h34M28 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <div className="text-base font-semibold text-green">Group price</div>
          <div className="num font-display mt-1 text-6xl font-semibold text-green">
            {money(b.groupUnitPrice)}
            <span className="text-2xl font-medium">/{offer.unitLabel}</span>
          </div>
        </div>
        <Badge tone="mint" className="self-center px-4 py-2 text-lg">{top.discountPct}% off</Badge>
        <div className="ml-auto text-right text-base text-muted">
          You buy <span className="num font-semibold text-ink">{offer.myMonthlyQty} {offer.unitLabel}s</span>/mo
        </div>
      </Card>

      <div className="mb-6">
        <PoolProgress offer={offer} joined={joined} onJoin={() => set({ joined: true })} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <DeliveryChoice offer={offer} value={delivery} onChange={(v) => set({ delivery: v })} />
        <CostBreakdown offer={offer} b={b} />
      </div>

      {joined && (
        <div className="mt-8 flex justify-end">
          <Link href="/overview" className="text-lg font-semibold text-green underline-offset-4 hover:underline">
            See your savings overview →
          </Link>
        </div>
      )}
    </>
  );
}
