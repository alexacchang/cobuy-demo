"use client";

import { useState } from "react";

type Month = { month: string; amount: number; partial?: boolean };

/** Monthly savings columns. Single series, so no legend; the card title names it. */
export function SavingsChart({ data }: { data: Month[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 270;
  const top = 34;
  const bottom = 34;
  const plotH = H - top - bottom;
  const max = Math.max(...data.map((d) => d.amount));
  const band = W / data.length;
  const barW = 40;
  const r = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={data.map((d) => `${d.month} $${d.amount}${d.partial ? " so far" : ""}`).join(", ")}>
      <defs>
        <pattern id="nov-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" className="fill-mint-soft" />
          <line x1="0" y1="0" x2="0" y2="8" className="stroke-green" strokeWidth="3" opacity="0.45" />
        </pattern>
      </defs>
      {data.map((d, i) => {
        const h = (d.amount / max) * plotH;
        const x = i * band + (band - barW) / 2;
        const y = top + plotH - h;
        const path = `M${x},${top + plotH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${top + plotH} Z`;
        const active = hover === i;
        return (
          <g key={d.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={i * band} y={0} width={band} height={H} fill="transparent" />
            <path
              d={path}
              className={d.partial ? "stroke-green" : "fill-green"}
              fill={d.partial ? "url(#nov-hatch)" : undefined}
              strokeWidth={d.partial ? 1.5 : 0}
              strokeDasharray={d.partial ? "4 3" : undefined}
              opacity={hover != null && !active ? 0.55 : 1}
            />
            <text x={x + barW / 2} y={y - 10} textAnchor="middle" className="num font-display fill-ink" fontSize="19" fontWeight="600">
              ${d.amount}
            </text>
            <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="16" fontWeight={d.partial ? 600 : 500} className="fill-muted">
              {d.partial ? `${d.month} (so far)` : d.month}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={W} y1={top + plotH} y2={top + plotH} className="stroke-line" strokeWidth="1.5" />
    </svg>
  );
}
