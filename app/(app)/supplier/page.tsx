import supplier from "@/data/supplier.json";
import { Badge, Card, CardTitle, PageHeader, Stat, cx } from "@/components/ui";
import { OaklandMap } from "@/components/supplier/OaklandMap";
import { QuoteButton } from "@/components/supplier/QuoteButton";

const s = supplier;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const usd2 = (n: number) => `$${n.toFixed(2)}`;
const areaShort = s.area.split(",")[0];
const committedRows = s.demand.filter((r) => r.status === "committed").length;

export default function SupplierPage() {
  return (
    <div>
      <div className="-mt-4 mb-8 flex items-center justify-between rounded-2xl bg-sidebar px-6 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-mint">
            <path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="1.8" fill="currentColor" />
            <circle cx="17" cy="18" r="1.8" fill="currentColor" />
          </svg>
          <span className="text-base font-semibold">
            Supplier view <span className="text-white/50">·</span> {s.supplier}
          </span>
        </div>
        <span className="text-sm text-white/70">What the wholesaler sees. Restaurants stay anonymous.</span>
      </div>

      <PageHeader eyebrow="Wholesaler dashboard" title={`Pooled demand in ${areaShort}`} subtitle={`${s.area} · ${s.period}`} />

      <div className="mb-6 grid grid-cols-12 gap-6">
        <Card className="col-span-7 grid grid-cols-3 content-center gap-6">
          <Stat label="Restaurants pooling" value={s.summary.restaurants} sub={`In ${areaShort}`} />
          <Stat label="Committed value" value={<span className="text-green">{usd(s.summary.committedValue)}</span>} sub={`${committedRows} products locked in`} />
          <Stat label="Forming value" value={usd(s.summary.formingValue)} sub={`${s.demand.length - committedRows} still pooling`} />
        </Card>
        <Card className="col-span-5 !p-3">
          <OaklandMap />
        </Card>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="px-6 pt-5 [&>div]:mb-3">
          <CardTitle right={<span className="text-sm text-muted">Monthly quantities</span>}>Demand by product</CardTitle>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="whitespace-nowrap border-b border-line text-sm text-muted">
              <th className="px-6 pb-2 font-medium">Product</th>
              <th className="pb-2 pr-4 text-right font-medium">Monthly qty</th>
              <th className="pb-2 pr-4 text-right font-medium">Restaurants</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Tier</th>
              <th className="pb-2 pr-4 text-right font-medium">Target price</th>
              <th className="pb-2 pr-4 font-medium">Closes</th>
              <th className="pb-2 pr-6" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.demand.map((r, i) => {
              const lead = i === 0;
              const committed = r.status === "committed";
              return (
                <tr key={r.product} className={cx(lead && "bg-mint-soft")}>
                  <td className={cx("px-6", lead ? "border-l-4 border-l-green py-5" : "py-3.5")}>
                    <div className={cx("font-semibold text-ink", lead ? "text-xl" : "text-base")}>{r.product}</div>
                    <div className="text-sm text-muted">{r.packSize}</div>
                  </td>
                  <td className="num whitespace-nowrap pr-4 text-right">
                    <span className={cx("font-display font-semibold text-ink", lead ? "text-3xl" : "text-xl")}>{r.qty}</span>{" "}
                    <span className="text-sm text-muted">{r.unit}</span>
                  </td>
                  <td className={cx("num pr-4 text-right font-semibold text-ink", lead ? "text-xl" : "text-base")}>{r.restaurants}</td>
                  <td className="pr-4">
                    <Badge tone={committed ? "green" : "amber"}>{committed ? "Committed" : "Forming"}</Badge>
                  </td>
                  <td className="num pr-4 text-[15px] text-ink">{r.tierReached}</td>
                  <td className={cx("num pr-4 text-right font-semibold text-ink", lead && "text-xl")}>{usd2(r.targetPrice)}</td>
                  <td className="num whitespace-nowrap pr-4 font-medium text-amber">{r.closes}</td>
                  <td className="pr-6 text-right">
                    <QuoteButton prominent={lead} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
