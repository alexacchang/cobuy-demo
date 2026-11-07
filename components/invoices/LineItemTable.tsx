"use client";
import type { LineItem } from "@/lib/types";
import { money } from "@/lib/offer-math";
import { cx } from "@/components/ui";

export const ROW_STAGGER_MS = 210;

/** Invoice line items. When `animate`, rows rise in one at a time. */
export function LineItemTable({
  items,
  animate,
  highlightName,
}: {
  items: LineItem[];
  animate: boolean;
  highlightName?: string | null;
}) {
  const hl = highlightName?.trim().toLowerCase();
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  return (
    <table className="w-full border-separate border-spacing-0 text-[17px] [&_tbody_td]:border-b [&_tbody_td]:border-line/70">
      <thead>
        <tr className="text-left [&>th]:border-b [&>th]:border-line text-sm font-semibold uppercase tracking-[0.08em] text-muted">
          <th className="py-3 pl-4 pr-3 font-semibold">Item as printed</th>
          <th className="px-3 py-3 text-right font-semibold">Qty</th>
          <th className="px-3 py-3 font-semibold">Unit</th>
          <th className="px-3 py-3 text-right font-semibold">Unit price</th>
          <th className="py-3 pl-3 pr-4 text-right font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, i) => {
          const on = !!hl && it.rawName.trim().toLowerCase() === hl;
          return (
            <tr
              key={`${i}-${it.rawName}`}
              className={cx(
                "transition-colors duration-700",
                animate && "animate-rise-in",
                on && "bg-mint-soft",
              )}
              style={animate ? { animationDelay: `${i * ROW_STAGGER_MS}ms` } : undefined}
            >
              <td className={cx("py-2 pl-4 pr-3 font-mono text-[16px] tracking-tight", on ? "font-semibold text-green" : "text-ink")}>
                <span className="flex items-center gap-2.5">
                  {on && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mint" aria-hidden />}
                  {it.rawName}
                </span>
              </td>
              <td className="num px-3 py-2 text-right">{it.quantity}</td>
              <td className="px-3 py-2 text-muted">{it.unit}</td>
              <td className="num px-3 py-2 text-right">{money(it.unitPrice)}</td>
              <td className="num py-2 pl-3 pr-4 text-right font-medium">{money(it.lineTotal)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr
          className={cx(animate && "animate-rise-in")}
          style={animate ? { animationDelay: `${items.length * ROW_STAGGER_MS}ms` } : undefined}
        >
          <td colSpan={4} className="py-3 pl-4 pr-3 text-right text-base font-semibold text-muted">
            {items.length} items
          </td>
          <td className="num py-3 pl-3 pr-4 text-right text-lg font-semibold text-ink">{money(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
