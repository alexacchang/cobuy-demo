import neighbors from "@/data/neighbors.json";

/** Stylised, not geographic: pins sit at their real distance from Rose Tea, angles are arbitrary. */
const ANGLES = [-50, 25, 150, 235];

export function OaklandMap() {
  const W = 420;
  const H = 210;
  const cx = 200;
  const cy = 100;
  const maxMi = Math.max(...neighbors.map((n) => n.distanceMi));
  const pxPerMi = 82 / maxMi;
  const pins = neighbors.map((n, i) => {
    const a = (ANGLES[i % ANGLES.length] * Math.PI) / 180;
    return { label: n.label.replace("Restaurant ", ""), x: cx + Math.cos(a) * n.distanceMi * pxPerMi, y: cy + Math.sin(a) * n.distanceMi * pxPerMi };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Stylised map of Oakland with Rose Tea and ${pins.length} anonymous restaurants`}>
      <rect width={W} height={H} rx="12" className="fill-paper" />
      {/* river edge */}
      <path d={`M0,${H - 26} C80,${H - 44} 160,${H - 12} 240,${H - 28} S${W},${H - 20} ${W},${H - 28} V${H} H0 Z`} className="fill-mint-soft" />
      {/* street grid */}
      <g className="stroke-line" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d={`M10,48 L${W - 10},34`} />
        <path d={`M10,112 L${W - 10},100`} />
        <path d="M80,10 L100,172" />
        <path d="M232,8 L242,170" />
        <path d="M350,14 L336,168" />
        <path d={`M20,166 Q160,130 ${W - 20},70`} strokeWidth="3" />
      </g>
      <circle cx={cx} cy={cy} r={maxMi * pxPerMi} fill="none" className="stroke-muted" strokeOpacity="0.35" strokeDasharray="3 5" strokeWidth="1.5" />
      <text x={W - 14} y={24} textAnchor="end" className="font-display fill-ink" fontSize="18" fontWeight="600">
        Oakland
      </text>
      <text x={W - 14} y={H - 8} textAnchor="end" className="fill-muted" fontSize="11" fontWeight="500">
        {`Ring = ${maxMi} mi`}
      </text>
      {pins.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="11" className="fill-green stroke-card" strokeWidth="2.5" />
          <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
            {p.label}
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r="12" className="fill-ink stroke-mint" strokeWidth="3" />
      <text x={cx - 19} y={cy + 4} textAnchor="end" className="fill-ink" fontSize="12" fontWeight="700">
        Rose Tea
      </text>
    </svg>
  );
}
