import Link from "next/link";
import dashboard from "@/data/dashboard.json";
import { Badge, Card, CardTitle, PageHeader, Stat } from "@/components/ui";
import { SavingsChart } from "@/components/overview/SavingsChart";
import { SwapCard } from "@/components/overview/SwapCard";

const d = dashboard;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const usd2 = (n: number) => `$${n.toFixed(2)}`;
const currentMonth = d.monthlySavings[d.monthlySavings.length - 1];
const joinedMonth = d.joinedSince.split(" ")[0];
const offerHref: Record<string, string> = { "fryer-oil": "/offer" };

export default function OverviewPage() {
  const a = d.priceAlert;
  const pctVsAug = Math.round(((a.yourPrice - a.augustPrice) / a.augustPrice) * 100);
  const pctVsNearby = Math.round(((a.yourPrice - a.nearbyMedian) / a.nearbyMedian) * 100);
  const totalMonthly = d.openOffers.reduce((s, o) => s + o.savePerMonth, 0);

  return (
    <div>
      <PageHeader eyebrow="Three months later" title="Good morning, Rose Tea" subtitle={`Here is where CoBuy stands as of ${d.asOf}.`} />

      <Card className="mb-6 grid grid-cols-4 divide-x divide-line !p-0">
        <Stat className="px-6 py-5" label="Saved this month" value={<span className="text-green">{usd(d.savedThisMonth)}</span>} sub={`${currentMonth.month}, so far`} />
        <Stat className="px-6 py-5" label="Saved since joining" value={usd(d.savedSinceJoining)} sub={`Since ${joinedMonth}`} />
        <Stat className="px-6 py-5" label="Open offers" value={d.openOffers.length} sub={`Up to ${usd(totalMonthly)}/mo more`} />
        <Stat className="px-6 py-5" label="Upcoming deliveries" value={d.upcomingDeliveries.length} sub={`Next: ${d.upcomingDeliveries[0].date}`} />
      </Card>

      <div className="mb-6 grid grid-cols-12 gap-6">
        <Card className="col-span-7">
          <CardTitle right={<span className="text-sm text-muted">Hatched = month in progress</span>}>Monthly savings</CardTitle>
          <SavingsChart data={d.monthlySavings} />
        </Card>

        <Card className="col-span-5">
          <CardTitle>Open offers</CardTitle>
          <ul className="divide-y divide-line">
            {d.openOffers.map((o) => {
              const href = offerHref[o.id];
              const body = (
                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold leading-snug text-ink">{o.productName}</div>
                    <div className="mt-0.5 text-sm text-muted">{o.status}</div>
                    <div className="mt-1 text-sm font-semibold text-amber">{o.deadline}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone="mint" className="num">{o.discountPct}% off</Badge>
                    <div className="num mt-1.5 text-sm font-semibold text-ink">Save {usd(o.savePerMonth)}/mo</div>
                  </div>
                </div>
              );
              return (
                <li key={o.id}>
                  {href ? (
                    <Link href={href} className="-mx-3 block rounded-xl px-3 hover:bg-mint-soft">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-amber">
          <div className="mb-3">
            <Badge tone="amber">Price alert</Badge>
          </div>
          <h3 className="text-xl font-semibold leading-snug text-ink">{a.product}</h3>
          <p className="mt-1 text-base text-muted">{a.message}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-soft px-4 py-3">
              <div className="text-sm font-medium text-amber">You pay now</div>
              <div className="num font-display mt-1 text-3xl font-semibold text-ink">{usd2(a.yourPrice)}</div>
            </div>
            <div className="rounded-xl border border-line px-4 py-3">
              <div className="text-sm font-medium text-muted">In August</div>
              <div className="num font-display mt-1 text-3xl font-semibold text-ink">{usd2(a.augustPrice)}</div>
            </div>
            <div className="rounded-xl border border-line px-4 py-3">
              <div className="text-sm font-medium text-muted">Nearby median</div>
              <div className="num font-display mt-1 text-3xl font-semibold text-ink">{usd2(a.nearbyMedian)}</div>
            </div>
          </div>
          <p className="num mt-4 text-sm text-muted">
            Up {pctVsAug}% since August, {pctVsNearby}% above what nearby restaurants pay.
          </p>
        </Card>
        <SwapCard swap={d.swapSuggestion} />
      </div>

      <Card>
        <CardTitle>Upcoming deliveries</CardTitle>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-muted">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Items</th>
              <th className="pb-2 font-medium">Method</th>
              <th className="pb-2 font-medium">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {d.upcomingDeliveries.map((x) => (
              <tr key={x.date + x.items}>
                <td className="num py-3 pr-4 font-semibold text-ink">{x.date}</td>
                <td className="num py-3 pr-4 text-ink">{x.items}</td>
                <td className="py-3 pr-4">
                  <Badge tone={x.method === "Shared pickup" ? "mint" : "neutral"}>{x.method}</Badge>
                </td>
                <td className="py-3 text-muted">{x.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
