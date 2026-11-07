"use client";
import Link from "next/link";
import type { Insight } from "@/lib/insight";
import { cx } from "@/components/ui";

/** The hero moment: "CoBuy noticed…". The whole card links to the reasoning view. */
export function InsightCard({ insight, animate }: { insight: Insight; animate: boolean }) {
  return (
    <Link
      href="/matches"
      className={cx(
        "group relative block overflow-hidden rounded-2xl border-2 border-mint bg-card px-9 py-8 outline-none transition-colors hover:border-green focus-visible:border-green",
        animate && "animate-rise-in",
      )}
    >
      <span className="absolute inset-y-0 left-0 w-2 bg-mint transition-colors group-hover:bg-green" aria-hidden />
      <div className="flex items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-green">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" aria-hidden />
            CoBuy noticed…
          </div>
          <p className="font-display mt-4 max-w-[760px] text-[38px] font-semibold leading-[1.15] text-ink">
            <span className="num">{insight.restaurantCount}</span> restaurants near you buy the same fryer oil under{" "}
            <span className="num">{insight.distinctNames}</span> different names.
          </p>
          <p className="font-display mt-3 text-[28px] font-medium leading-snug text-ink">
            Combined, you qualify for{" "}
            <span className="num rounded-lg bg-mint-soft px-2 font-semibold text-green">{insight.discountPct}% off</span>.
          </p>
        </div>
        <span className="mb-1 inline-flex shrink-0 items-center gap-2 rounded-xl bg-green px-6 py-3.5 text-lg font-semibold text-white transition-colors group-hover:bg-green-dark">
          See why
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
            <path d="M4 10h11M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
