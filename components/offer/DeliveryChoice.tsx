"use client";
import { Card, CardTitle, cx } from "@/components/ui";
import type { Offer } from "@/lib/types";

type Choice = "door" | "pickup";

export default function DeliveryChoice({ offer, value, onChange }: { offer: Offer; value: Choice; onChange: (v: Choice) => void }) {
  const pickup = offer.pickupLocation.replace(/^Shared pickup:\s*/i, "");
  const options: { id: Choice; title: string; detail: string; note: string }[] = [
    { id: "door", title: "To my door", detail: `Next delivery ${offer.nextDelivery}`, note: `Delivered by ${offer.supplier}` },
    { id: "pickup", title: "Shared pickup", detail: pickup, note: "Extra pickup savings not included below" },
  ];
  return (
    <Card className="p-8">
      <CardTitle>Delivery</CardTitle>
      <div role="radiogroup" aria-label="Delivery" className="grid gap-4">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.id)}
              className={cx(
                "flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-colors",
                on ? "border-green bg-mint-soft" : "border-line bg-card hover:border-ink/30",
              )}
            >
              <span className={cx("mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-green" : "border-ink/30")}>
                {on && <span className="h-3 w-3 rounded-full bg-green" />}
              </span>
              <span>
                <span className="block text-xl font-semibold text-ink">{o.title}</span>
                <span className="mt-1 block text-base text-ink">{o.detail}</span>
                <span className="mt-1 block text-sm text-muted">{o.note}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
