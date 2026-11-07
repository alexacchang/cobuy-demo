import type { MatchMember } from "@/lib/types";
import { ROSE_TEA, distanceFor } from "@/lib/insight";
import { cx } from "@/components/ui";

export function RestaurantLabel({ restaurant, className }: { restaurant: string; className?: string }) {
  const you = restaurant === ROSE_TEA;
  const d = distanceFor(restaurant);
  return (
    <div className={cx("flex items-baseline justify-between gap-2", className)}>
      <span className="text-base font-semibold text-ink">
        {you ? (
          <>
            <span className="text-green">You</span>
            <span className="text-muted"> · </span>Rose Tea Cafe
          </>
        ) : (
          restaurant
        )}
      </span>
      {!you && d != null && <span className="num shrink-0 text-sm font-medium text-muted">{d} mi</span>}
    </div>
  );
}

/** One restaurant's original invoice line next to the AI's reason it's the same product. */
export function MemberCard({ m, unit, delayMs }: { m: MatchMember; unit: string; delayMs: number }) {
  const you = m.restaurant === ROSE_TEA;
  const pct = Math.round(m.confidence * 100);
  return (
    <div
      className={cx(
        "animate-rise-in flex flex-col rounded-2xl border bg-card p-4",
        you ? "border-mint ring-1 ring-mint" : "border-line",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <RestaurantLabel restaurant={m.restaurant} />

      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{you ? "On your invoice" : "On their invoice"}</div>
      <div className="mt-1.5 min-h-[72px] rounded-lg border border-dashed border-ink/20 bg-paper px-3 py-2.5 font-mono text-[17px] font-medium leading-snug tracking-tight text-ink">
        {m.rawName}
      </div>

      <div className="num font-display mt-3 text-xl font-semibold text-ink">
        {m.monthlyQty} <span className="text-base font-medium text-muted">{unit}s/mo</span>
      </div>

      <p className="mt-2 text-[15px] leading-snug text-ink/80">{m.reason}</p>

      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-muted">Confidence</span>
          <span className="num font-semibold text-green">{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
