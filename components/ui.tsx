import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Shared primitives. Keep screens visually consistent by building from these. */

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function PageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-8 flex items-end justify-between gap-6">
      <div>
        {eyebrow && <div className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-green">{eyebrow}</div>}
        <h1 className="text-[40px] font-semibold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-lg text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-2xl border border-line bg-card p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-ink">{children}</h2>
      {right}
    </div>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost";
const btn: Record<BtnVariant, string> = {
  primary: "bg-green text-white hover:bg-green-dark",
  secondary: "border border-line bg-card text-ink hover:border-ink/30",
  ghost: "text-green hover:bg-mint-soft",
};
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: BtnVariant }) {
  return <button className={cx(btnBase, btn[variant], className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", className, ...rest }: ComponentProps<typeof Link> & { variant?: BtnVariant }) {
  return <Link className={cx(btnBase, btn[variant], className)} {...rest} />;
}

type Tone = "green" | "mint" | "amber" | "neutral";
const tone: Record<Tone, string> = {
  green: "bg-green text-white",
  mint: "bg-mint-soft text-green",
  amber: "bg-amber-soft text-amber",
  neutral: "bg-paper text-muted border border-line",
};

export function Badge({ tone: t = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", tone[t], className)}>{children}</span>;
}

/** Big number tile. */
export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className="num font-display mt-1 text-4xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

/** Small label showing where AI output came from (live model vs cache). Keep it subtle. */
export function SourceTag({ source, ms }: { source: "live" | "cached" | "fallback"; ms?: number }) {
  const text = source === "live" ? "Live AI" : source === "cached" ? "Cached AI" : "Cached AI (fallback)";
  return (
    <span className="num text-xs font-medium text-muted">
      {text}
      {ms != null && ` · ${(ms / 1000).toFixed(1)}s`}
    </span>
  );
}
