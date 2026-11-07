// SERVER ONLY (imported by app/api/extract/route.ts).
import { AiError, chatJSON, extractModel } from "@/lib/openrouter";
import { ExtractResultSchema, type ExtractResult } from "@/lib/types";
import { LIVE_TIMEOUT_MS, zodNote } from "./envelope";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

const PROMPT = `You are reading a restaurant supplier invoice image. Return ONLY a JSON object, no prose, no code fences:
{"supplier": string, "invoiceDate": "yyyy-mm-dd", "lineItems": [{"rawName": string, "quantity": number, "unit": string, "unitPrice": number, "lineTotal": number}]}
Rules:
- supplier: the company that issued the invoice (not the bill-to customer).
- invoiceDate: the invoice date, formatted yyyy-mm-dd.
- rawName: the item description EXACTLY as printed, keeping the invoice's abbreviations, capitalization and symbols (e.g. "#", "CT"). Do not expand or fix it. Do not include the SKU/item number.
- quantity, unitPrice, lineTotal: plain numbers (no "$", no commas). unit: the unit as printed (e.g. "CS", "BAG").
- One entry per product line, in invoice order. EXCLUDE subtotal, tax, fuel surcharge, deposit, and total rows.`;

export async function readImageFile(form: FormData): Promise<{ dataUrl: string }> {
  const file = form.get("file");
  if (!file || typeof file === "string") throw new AiError("no file in form field \"file\"");
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED.has(type)) throw new AiError(`unsupported file type "${type || "unknown"}" (need PNG/JPG/WebP)`);
  if (file.size > MAX_BYTES) throw new AiError(`file too large (${Math.round(file.size / 1024)} KB)`);
  const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { dataUrl: `data:${type === "image/jpg" ? "image/jpeg" : type};base64,${b64}` };
}

/** "$1,234.50" → 1234.5 ; leaves real numbers alone. */
function num(v: unknown): unknown {
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : v;
  }
  return v;
}

function coerce(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  const items = Array.isArray(r.lineItems) ? r.lineItems : r.line_items;
  return {
    supplier: typeof r.supplier === "string" ? r.supplier.trim() : r.supplier,
    invoiceDate: typeof r.invoiceDate === "string" ? r.invoiceDate.trim() : r.invoiceDate,
    lineItems: Array.isArray(items)
      ? items.map((it) => {
          const i = (it ?? {}) as Record<string, unknown>;
          return {
            rawName: typeof i.rawName === "string" ? i.rawName.trim() : i.rawName,
            quantity: num(i.quantity),
            unit: typeof i.unit === "string" ? i.unit.trim() : (i.unit ?? ""),
            unitPrice: num(i.unitPrice),
            lineTotal: num(i.lineTotal),
          };
        })
      : items,
  };
}

const TOTAL_ROW = /^(sub\s*-?\s*total|total|tax|sales tax|fuel surcharge|balance)/i;

export async function extractLive(dataUrl: string): Promise<ExtractResult> {
  const raw = await chatJSON({
    model: extractModel(),
    timeoutMs: LIVE_TIMEOUT_MS,
    maxTokens: 3000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  const parsed = ExtractResultSchema.safeParse(coerce(raw));
  if (!parsed.success) {
    console.warn("[api/extract] schema mismatch, raw:", JSON.stringify(raw).slice(0, 800));
    throw new AiError(zodNote("extract schema mismatch", parsed.error.issues));
  }
  const lineItems = parsed.data.lineItems.filter((li) => li.rawName && !TOTAL_ROW.test(li.rawName));
  if (lineItems.length === 0) throw new AiError("extract sanity check failed: no line items");
  return { ...parsed.data, lineItems };
}
