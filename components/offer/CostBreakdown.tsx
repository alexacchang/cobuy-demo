import { Card, CardTitle } from "@/components/ui";
import type { Offer } from "@/lib/types";
import { money, type OfferBreakdown } from "@/lib/offer-math";

export default function CostBreakdown({ offer, b }: { offer: Offer; b: OfferBreakdown }) {
  return (
    <Card className="p-8">
      <CardTitle>Your monthly cost</CardTitle>
      <table className="num w-full text-lg">
        <tbody>
          <tr>
            <td className="py-2 text-ink">
              {offer.myMonthlyQty} jugs × {money(b.groupUnitPrice)}
            </td>
            <td className="py-2 text-right text-ink">{money(b.groupSubtotal)}</td>
          </tr>
          <tr>
            <td className="py-2 text-muted">CoBuy fee ({offer.feePctOfSavings}% of savings)</td>
            <td className="py-2 text-right text-muted">{money(b.fee)}</td>
          </tr>
          <tr className="border-t-2 border-ink">
            <td className="pt-4 pb-2 text-xl font-semibold text-ink">Total</td>
            <td className="pt-4 pb-2 text-right text-xl font-semibold text-ink">
              {money(b.total)}
              <span className="text-base font-medium text-muted">/mo</span>
            </td>
          </tr>
          <tr>
            <td className="py-2 text-muted">Buying alone</td>
            <td className="py-2 text-right text-muted line-through decoration-1">{money(b.aloneTotal)}</td>
          </tr>
        </tbody>
      </table>
      <div className="num mt-4 flex items-baseline justify-between rounded-xl bg-mint-soft px-5 py-4">
        <span className="text-lg font-semibold text-green">You save</span>
        <span className="font-display text-3xl font-semibold text-green">
          {money(b.netSavings)}
          <span className="text-lg font-medium">/mo</span>
        </span>
      </div>
    </Card>
  );
}
