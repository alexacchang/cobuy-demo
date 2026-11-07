"use client";
import { useEffect, useRef, useState } from "react";
import { Card, cx } from "@/components/ui";
import type { Offer } from "@/lib/types";
import { computeOffer } from "@/lib/offer-math";
import { fryerParticipants } from "./participants";

const DURATION = 1200;
const EASE_CSS = "cubic-bezier(0.33, 1, 0.68, 1)"; // ease-out cubic
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // same curve, for the count-up

export default function PoolProgress({ offer, joined, onJoin }: { offer: Offer; joined: boolean; onJoin: () => void }) {
  const before = computeOffer(offer, false);
  const after = computeOffer(offer, true);
  const target = before.targetQty;
  const scaleMax = Math.ceil((target * 1.2) / 4) * 4; // 48: leaves room past the tier so overshoot shows
  const pct = (q: number) => `${(q / scaleMax) * 100}%`;
  const lowTier = offer.tiers[0];
  const top = offer.tiers[offer.tiers.length - 1];

  // `animating` is only true for a Join click in this session; a reload with joined=true renders the end state.
  const [animating, setAnimating] = useState(false);
  const [count, setCount] = useState(before.poolQty);
  const [barQty, setBarQty] = useState(before.poolQty);
  const raf = useRef<number | null>(null);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  useEffect(() => {
    if (!joined) { // demo reset
      if (raf.current) cancelAnimationFrame(raf.current);
      setAnimating(false);
    }
  }, [joined]);

  function join() {
    const from = before.poolQty;
    const to = after.poolQty;
    setAnimating(true);
    setCount(from);
    setBarQty(from);
    onJoin();
    // Next frame: move the bar target so the CSS transition runs; count up in rAF on the same curve.
    const start = performance.now();
    requestAnimationFrame(() => setBarQty(to));
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setCount(from + (to - from) * easeOut(t));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  const shownCount = animating ? count : joined ? after.poolQty : before.poolQty;
  const shownBar = animating ? barQty : joined ? after.poolQty : before.poolQty;
  const unlocked = shownCount >= target;
  const restaurants = offer.othersCount + (joined ? 1 : 0);
  const youWidth = Math.max(0, shownBar - before.poolQty);
  const transition = animating ? { transition: `width ${DURATION}ms ${EASE_CSS}` } : undefined;

  return (
    <Card className="p-8">
      <style>{`
        @keyframes offer-flash {
          0% { box-shadow: 0 0 0 0 rgba(143,211,168,0.95); transform: scale(1); }
          35% { box-shadow: 0 0 0 10px rgba(143,211,168,0.5); transform: scale(1.12); }
          100% { box-shadow: 0 0 0 22px rgba(143,211,168,0); transform: scale(1); }
        }
        .offer-flash { animation: offer-flash 900ms ease-out both; }
      `}</style>

      <div className="flex items-start justify-between gap-8">
        <div>
          <h2 className="text-xl font-semibold text-ink">Neighborhood pool</h2>
          <p className="mt-3 text-2xl text-ink">
            <span className="num font-display text-5xl font-semibold text-ink">{Math.floor(shownCount)}</span>
            <span className="text-muted"> of {target} jugs committed by </span>
            <span className="num font-semibold">{restaurants}</span>
            <span className="text-muted"> restaurants{joined ? ", including you" : " nearby"}</span>
          </p>
        </div>
        {joined ? (
          <button
            disabled
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-green bg-mint-soft px-7 py-4 text-lg font-semibold text-green"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Joined
          </button>
        ) : (
          <button
            onClick={join}
            className="inline-flex shrink-0 items-center rounded-xl bg-green px-7 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            Join with {offer.myMonthlyQty} jugs/mo
          </button>
        )}
      </div>

      {/* Bar */}
      <div className="relative mt-16 mb-3">
        {/* tier marker label */}
        <div className="absolute bottom-full mb-3 -translate-x-1/2" style={{ left: pct(target) }}>
          <div
            key={unlocked ? "on" : "off"}
            className={cx(
              "num whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold",
              unlocked ? "bg-mint text-ink" : "border border-ink/20 bg-card text-ink",
              unlocked && animating && "offer-flash",
            )}
          >
            {top.discountPct}% tier · {target} jugs
          </div>
        </div>

        <div className="relative h-12 overflow-visible rounded-full bg-[#ECEAE3]">
          {/* others */}
          <div className="absolute inset-y-0 left-0 rounded-l-full bg-green" style={{ width: pct(before.poolQty) }} />
          {/* your preview (dashed) */}
          {!joined && (
            <div
              className="absolute inset-y-0 flex items-center rounded-r-full border-2 border-dashed pl-4 border-green bg-mint-soft text-sm font-semibold text-green"
              style={{ left: pct(before.poolQty), width: pct(offer.myMonthlyQty) }}
            >
              your {offer.myMonthlyQty} jugs
            </div>
          )}
          {/* your committed segment */}
          {joined && (
            <div
              className="absolute inset-y-0 rounded-r-full border-l-2 border-white bg-green"
              style={{ left: pct(before.poolQty), width: pct(youWidth), ...transition }}
            />
          )}
          {/* tier marker line */}
          <div
            className={cx("absolute -top-2 -bottom-2 w-1 -translate-x-1/2 rounded-full transition-colors duration-300", unlocked ? "bg-mint" : "bg-ink")}
            style={{ left: pct(target) }}
          />
        </div>

        {/* axis */}
        <div className="num relative mt-3 h-6 text-sm text-muted">
          <span className="absolute left-0">0</span>
          <span className="absolute -translate-x-1/2 font-semibold text-ink" style={{ left: pct(target) }}>{target}</span>
          <span className="absolute right-0">{scaleMax}</span>
        </div>
        {/* tier regions */}
        <div className="relative mt-1 flex text-sm font-semibold">
          <div className="border-t-2 border-line pt-2 text-center text-muted" style={{ width: pct(target) }}>
            {lowTier.discountPct}% off below {target} jugs
          </div>
          <div className={cx("border-t-2 pt-2 text-center transition-colors", unlocked ? "border-mint text-green" : "border-line text-muted")} style={{ width: pct(scaleMax - target) }}>
            {top.discountPct}% off
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {fryerParticipants.map((p) => (
          <span key={p.label} className="num inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-base text-ink">
            <span className="font-semibold">{p.label}</span>
            <span className="text-muted">{p.qty} jugs</span>
          </span>
        ))}
        {joined && (
          <span className={cx("num inline-flex items-center gap-2 rounded-full bg-green px-4 py-2 text-base text-white", animating && "animate-rise-in")}>
            <span className="font-semibold">You</span>
            <span className="text-white/80">{offer.myMonthlyQty} jugs</span>
          </span>
        )}
      </div>

      {/* Success banner */}
      {unlocked && (
        <div
          className={cx("mt-6 flex items-center gap-4 rounded-xl border border-mint bg-mint-soft px-6 py-4", animating && "animate-rise-in")}
          role="status"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green text-white">
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
              <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display text-2xl font-semibold text-green">Tier reached, everyone gets {top.discountPct}% off.</span>
        </div>
      )}
    </Card>
  );
}
