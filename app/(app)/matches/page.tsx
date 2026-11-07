"use client";
import { useMemo } from "react";
import catalog from "@/data/catalog.json";
import { ButtonLink, Card, PageHeader, SourceTag } from "@/components/ui";
import { MemberCard } from "@/components/matches/MemberCard";
import { useHydrated } from "@/components/invoices/useHydrated";
import { useDemo } from "@/lib/demo-store";
import { FRYER_OIL_ID, distanceFor, fryerOffer, fryerOilInsight } from "@/lib/insight";
import type { CatalogProduct } from "@/lib/types";

const CATALOG = catalog as CatalogProduct[];
const STAGGER = 130;
const LOOKALIKE = /oil|shortening|fry/i;

const product = (id: string) => CATALOG.find((c) => c.id === id);
const shortPack = (p: string) => p.replace(/\s*\(.*\)\s*/, "").trim();

export default function MatchesPage() {
  const ready = useHydrated();
  const { match } = useDemo();

  const view = useMemo(() => {
    if (!match) return null;
    const insight = fryerOilInsight(match.data);
    if (!insight) return null;
    const fryerNames = new Set(insight.group.members.map((m) => m.rawName.trim().toLowerCase()));
    const decoys =
      match.data.groups
        .find((g) => g.catalogId === null)
        ?.members.filter((m) => LOOKALIKE.test(m.rawName) && !fryerNames.has(m.rawName.trim().toLowerCase())) ?? [];
    const others = match.data.groups
      .filter((g) => g.catalogId && g.catalogId !== FRYER_OIL_ID && new Set(g.members.map((m) => m.restaurant)).size > 1)
      .map((g) => ({ id: g.catalogId!, name: product(g.catalogId!)?.name ?? g.catalogId!, count: new Set(g.members.map((m) => m.restaurant)).size }))
      .sort((a, b) => b.count - a.count);
    const maxDist = Math.max(0, ...insight.group.members.map((m) => distanceFor(m.restaurant) ?? 0));
    return { insight, decoys, others, maxDist };
  }, [match]);

  if (!ready) return null;

  if (!match || !view) {
    return (
      <div>
        <PageHeader eyebrow="Step 2" title="Matches" subtitle="See how CoBuy matches what you buy with what restaurants nearby buy." />
        <Card className="flex flex-col items-start gap-5 px-8 py-10">
          <p className="font-display text-2xl font-semibold text-ink">
            {match ? "CoBuy didn't find a shared fryer oil product yet." : "No invoice read yet."}
          </p>
          <p className="max-w-xl text-lg text-muted">Upload a supplier invoice first. CoBuy will compare its line items with nearby restaurants.</p>
          <ButtonLink href="/invoices">Go to invoices</ButtonLink>
        </Card>
      </div>
    );
  }

  const { insight, decoys, others, maxDist } = view;
  const fryer = product(FRYER_OIL_ID);
  const unit = fryerOffer.unitLabel;
  const n = insight.group.members.length;

  return (
    <div>
      <PageHeader
        eyebrow="CoBuy's reasoning"
        title={`Same product, ${insight.distinctNames} different names`}
        subtitle={
          <>
            {insight.restaurantCount} restaurants within {maxDist} miles buy 35 lb canola fryer oil. CoBuy matched them from their invoices.
          </>
        }
        right={<span className="mb-2 shrink-0"><SourceTag source={match.source} ms={match.ms} /></span>}
      />

      {/* One card per restaurant */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {insight.group.members.map((m, i) => (
          <MemberCard key={`${m.restaurant}-${i}`} m={m} unit={unit} delayMs={i * STAGGER} />
        ))}
      </div>

      {/* Connector: every card feeds into one product */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden>
        {insight.group.members.map((m, i) => (
          <div key={i} className="animate-rise-in flex justify-center" style={{ animationDelay: `${n * STAGGER + 80}ms` }}>
            <div className="h-7 w-0.5 bg-mint" />
          </div>
        ))}
      </div>
      <div
        className="animate-rise-in flex items-center justify-between gap-8 rounded-2xl border-2 border-mint bg-mint-soft px-8 py-5"
        style={{ animationDelay: `${n * STAGGER + 160}ms` }}
      >
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.12em] text-green">All matched to</div>
          <div className="font-display mt-1 text-[30px] font-semibold leading-tight text-ink">
            {fryer?.name ?? fryerOffer.productName}
            <span className="text-muted"> · </span>
            {shortPack(fryer?.packSize ?? fryerOffer.packSize)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-7">
          <div className="text-right">
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-green">Pooled demand</div>
            <div className="num font-display mt-1 text-[30px] font-semibold leading-tight text-ink">
              {insight.pooledQty} <span className="text-xl font-medium text-muted">{unit}s/mo</span>
            </div>
          </div>
          <ButtonLink href="/offer" className="px-6 py-3.5 text-lg">
            See group offer
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M4 10h11M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ButtonLink>
        </div>
      </div>

      {/* Secondary: what the AI rejected, and what else it found */}
      <div className="mt-10 grid grid-cols-[1fr_320px] items-start gap-6">
        {decoys.length > 0 ? (
          <section className="animate-rise-in" style={{ animationDelay: `${n * STAGGER + 320}ms` }}>
            <h2 className="text-xl font-semibold text-ink">Not the same product</h2>
            <p className="mt-1 text-base text-muted">Look-alikes on neighbors&apos; invoices that CoBuy kept out of the group.</p>
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card/60">
              {decoys.map((d, i) => (
                <li key={i} className="grid grid-cols-[150px_250px_1fr] items-start gap-5 px-5 py-4">
                  <div className="pt-0.5">
                    <div className="text-base font-semibold text-muted">{d.restaurant === "Rose Tea Cafe" ? "You" : d.restaurant}</div>
                    {distanceFor(d.restaurant) != null && <div className="num text-sm text-muted/80">{distanceFor(d.restaurant)} mi</div>}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <span className="font-mono text-[16px] text-muted line-through decoration-ink/25">{d.rawName}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                        <path d="M2 2l6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      Not matched
                    </span>
                  </div>
                  <p className="pt-0.5 text-base leading-snug text-muted">{d.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div />
        )}

        {others.length > 0 && (
          <section className="animate-rise-in" style={{ animationDelay: `${n * STAGGER + 420}ms` }}>
            <h2 className="text-xl font-semibold text-ink">CoBuy also found</h2>
            <p className="mt-1 text-base text-muted">Other products you share, by number of restaurants.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[15px] text-ink">
                  {o.name}
                  <span className="num rounded-full bg-mint-soft px-2 text-sm font-semibold text-green">{o.count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
