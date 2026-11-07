import type { Metadata } from "next";
import invoice from "@/data/invoice.json";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: `Invoice ${invoice.invoiceNo} | Three Rivers Foodservice`,
};

const usd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "2026-10-28" -> "10/28/2026" (string math, so no timezone shifts)
const usDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

const css = `
html, body { background: #E9E9E6 !important; }
.inv-wrap { padding: 32px 16px 48px; display: flex; flex-direction: column; align-items: center; gap: 12px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #000; }
.inv-toolbar { width: 816px; display: flex; justify-content: flex-end; }
.inv-print-btn { font: 600 13px/1 "Helvetica Neue", Arial, sans-serif; padding: 8px 14px; background: #fff;
  border: 1px solid #888; border-radius: 3px; cursor: pointer; color: #000; }
.inv-print-btn:hover { background: #f2f2f2; }
.inv-page { width: 816px; min-height: 1056px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.18);
  padding: 44px 48px 36px; box-sizing: border-box; display: flex; flex-direction: column; font-size: 13px; line-height: 1.35; }
.mono { font-family: Menlo, "SF Mono", Consolas, "Courier New", monospace; font-variant-numeric: tabular-nums; }
.inv-head { display: flex; justify-content: space-between; align-items: flex-start; }
.inv-brand { display: flex; gap: 14px; align-items: flex-start; }
.inv-brand-name { font-size: 22px; font-weight: 800; letter-spacing: .04em; line-height: 1.05; }
.inv-brand-sub { font-size: 11px; font-weight: 700; letter-spacing: .22em; margin-top: 3px; }
.inv-brand-addr { margin-top: 8px; font-size: 12.5px; }
.inv-title { text-align: right; }
.inv-title h1 { font-size: 30px; font-weight: 800; letter-spacing: .12em; margin: 0 0 8px; }
.inv-meta { border-collapse: collapse; margin-left: auto; font-size: 12.5px; }
.inv-meta th { text-align: left; font-weight: 700; padding: 3px 10px; border: 1px solid #000; background: #EDEDED; white-space: nowrap; }
.inv-meta td { padding: 3px 10px; border: 1px solid #000; text-align: right; white-space: nowrap; }
.inv-rule { border: 0; border-top: 3px solid #000; margin: 18px 0 14px; }
.inv-parties { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.inv-box { border: 1px solid #000; }
.inv-box-h { background: #000; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .12em; padding: 3px 8px; }
.inv-box-b { padding: 7px 8px; font-size: 13px; min-height: 64px; }
.inv-box-b strong { font-weight: 700; }
.inv-items { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13.5px; }
.inv-items thead th { background: #000; color: #fff; font-size: 11.5px; font-weight: 700; letter-spacing: .06em;
  padding: 6px 8px; text-align: left; }
.inv-items thead th.r, .inv-items td.r { text-align: right; }
.inv-items thead th.c, .inv-items td.c { text-align: center; }
.inv-items tbody td { padding: 7px 8px; border-bottom: 1px solid #999; color: #000; }
.inv-items tbody tr:nth-child(even) td { background: #F3F3F3; }
.inv-items td.desc { font-weight: 600; letter-spacing: .01em; }
.inv-lower { display: flex; justify-content: space-between; gap: 24px; margin-top: 16px; }
.inv-notes { font-size: 12px; max-width: 380px; }
.inv-notes p { margin: 0 0 5px; }
.inv-sig { margin-top: 18px; display: flex; gap: 18px; font-size: 11.5px; }
.inv-sig div { flex: 1; border-top: 1px solid #000; padding-top: 3px; }
.inv-totals { border-collapse: collapse; min-width: 270px; font-size: 13.5px; }
.inv-totals th { text-align: left; font-weight: 600; padding: 5px 10px; border: 1px solid #000; }
.inv-totals td { text-align: right; padding: 5px 10px; border: 1px solid #000; }
.inv-totals tr.total th, .inv-totals tr.total td { background: #000; color: #fff; font-size: 16px; font-weight: 800; }
.inv-spacer { flex: 1; min-height: 20px; }
.inv-foot { border-top: 2px solid #000; padding-top: 10px; display: flex; justify-content: space-between; gap: 24px; font-size: 12px; }
.inv-foot h4 { margin: 0 0 3px; font-size: 11px; letter-spacing: .12em; font-weight: 800; }
.inv-fine { margin-top: 10px; font-size: 10.5px; line-height: 1.4; color: #222; }
@media print {
  @page { size: letter; margin: 0; }
  html, body { background: #fff !important; }
  .inv-wrap { padding: 0; display: block; }
  .inv-toolbar { display: none !important; }
  .inv-page { box-shadow: none; width: 8.5in; height: 11in; min-height: 0; overflow: hidden; break-inside: avoid; page-break-after: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const shotCss = `
html, body { background: #fff !important; margin: 0; }
.inv-wrap.inv-shot { padding: 24px; display: block; width: 816px; }
.inv-shot .inv-page { box-shadow: 0 0 0 1px #bbb; }
nextjs-portal { display: none !important; }
`;

function Logo() {
  // Simple geometric mark: three converging river bands in a square.
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
      <rect x="0" y="0" width="58" height="58" fill="#000" />
      <path d="M6 16 C 20 16, 24 29, 29 29" stroke="#fff" strokeWidth="5" fill="none" />
      <path d="M6 42 C 20 42, 24 29, 29 29" stroke="#fff" strokeWidth="5" fill="none" />
      <path d="M29 29 L 52 29" stroke="#fff" strokeWidth="7" fill="none" />
    </svg>
  );
}

// ?shot=1 is used by scripts/render-invoice.sh: no toolbar, white 24px margin, no dev overlay.
export default async function SampleInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const shot = (await searchParams).shot === "1";
  const { supplier, billTo, lineItems } = invoice;
  const totalUnits = lineItems.reduce((s, li) => s + li.quantity, 0);

  return (
    <div className={shot ? "inv-wrap inv-shot" : "inv-wrap"}>
      <style dangerouslySetInnerHTML={{ __html: css + (shot ? shotCss : "") }} />
      {!shot && (
        <div className="inv-toolbar">
          <PrintButton />
        </div>
      )}

      <div className="inv-page" id="invoice">
        <div className="inv-head">
          <div className="inv-brand">
            <Logo />
            <div>
              <div className="inv-brand-name">THREE RIVERS</div>
              <div className="inv-brand-sub">FOODSERVICE</div>
              <div className="inv-brand-addr">
                {supplier.address.map((l) => (
                  <div key={l}>{l}</div>
                ))}
                <div>Tel {supplier.phone}</div>
                <div>{supplier.email}</div>
              </div>
            </div>
          </div>
          <div className="inv-title">
            <h1>INVOICE</h1>
            <table className="inv-meta">
              <tbody>
                <tr><th>Invoice No.</th><td className="mono">{invoice.invoiceNo}</td></tr>
                <tr><th>Invoice Date</th><td className="mono">{usDate(invoice.invoiceDate)}</td></tr>
                <tr><th>Due Date</th><td className="mono">{usDate(invoice.dueDate)}</td></tr>
                <tr><th>Terms</th><td>{invoice.terms}</td></tr>
                <tr><th>Account No.</th><td className="mono">{billTo.accountNo}</td></tr>
                <tr><th>Route</th><td>{invoice.route}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className="inv-rule" />

        <div className="inv-parties">
          <div className="inv-box">
            <div className="inv-box-h">BILL TO</div>
            <div className="inv-box-b">
              <strong>{billTo.name.toUpperCase()}</strong>
              {billTo.address.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
          <div className="inv-box">
            <div className="inv-box-h">SHIP TO</div>
            <div className="inv-box-b">
              <strong>{billTo.name.toUpperCase()}</strong>
              {billTo.address.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
          <div className="inv-box">
            <div className="inv-box-h">DELIVERY</div>
            <div className="inv-box-b">
              <div>Delivered: <span className="mono">{usDate(invoice.invoiceDate)}</span></div>
              <div>Route: {invoice.route}</div>
              <div>Salesrep: 07</div>
            </div>
          </div>
        </div>

        <table className="inv-items">
          <thead>
            <tr>
              <th style={{ width: 70 }}>SKU</th>
              <th>DESCRIPTION</th>
              <th className="r" style={{ width: 50 }}>QTY</th>
              <th className="c" style={{ width: 56 }}>UNIT</th>
              <th className="r" style={{ width: 92 }}>UNIT PRICE</th>
              <th className="r" style={{ width: 100 }}>EXT PRICE</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li) => (
              <tr key={li.sku}>
                <td className="mono">{li.sku}</td>
                <td className="desc">{li.rawName}</td>
                <td className="r mono">{li.quantity}</td>
                <td className="c">{li.unit}</td>
                <td className="r mono">{usd(li.unitPrice)}</td>
                <td className="r mono">{usd(li.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-lower">
          <div className="inv-notes">
            <p><strong>Lines:</strong> {lineItems.length} &nbsp; <strong>Total pieces:</strong> <span className="mono">{totalUnits}</span></p>
            <p>Thank you for your business. Please reference invoice number with payment.</p>
            <div className="inv-sig">
              <div>Received by (print)</div>
              <div>Signature</div>
            </div>
          </div>
          <table className="inv-totals">
            <tbody>
              <tr><th>Subtotal</th><td className="mono">{usd(invoice.subtotal)}</td></tr>
              <tr><th>Fuel Surcharge</th><td className="mono">{usd(invoice.fuelSurcharge)}</td></tr>
              <tr><th>Sales Tax</th><td className="mono">{usd(invoice.tax)}</td></tr>
              <tr className="total"><th>TOTAL DUE</th><td className="mono">${usd(invoice.total)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="inv-spacer" />

        <div className="inv-foot">
          <div>
            <h4>REMIT TO</h4>
            <div>{supplier.name}</div>
            <div>Attn: Accounts Receivable</div>
            {supplier.address.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div>
            <h4>QUESTIONS</h4>
            <div>Customer Service {supplier.phone}</div>
            <div>{supplier.email}</div>
            <div>Mon-Sat 5:00 AM - 3:00 PM</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h4>AMOUNT DUE</h4>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>${usd(invoice.total)}</div>
            <div>by <span className="mono">{usDate(invoice.dueDate)}</span></div>
          </div>
        </div>
        <div className="inv-fine">
          Claims for shortages, damages or temperature issues must be made within 24 hours of delivery. Perishable
          products may not be returned once accepted. Past due balances are subject to a 1.5% monthly service charge.
          Prices subject to change without notice. Page 1 of 1.
        </div>
      </div>
    </div>
  );
}
