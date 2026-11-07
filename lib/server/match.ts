// SERVER ONLY (imported by app/api/match/route.ts).
import catalogJson from "@/data/catalog.json";
import neighborsJson from "@/data/neighbors.json";
import { AiError, chatJSON, matchModel } from "@/lib/openrouter";
import {
  MatchResultSchema,
  type CatalogProduct,
  type LineItem,
  type MatchGroup,
  type MatchMember,
  type MatchResult,
  type Neighbor,
} from "@/lib/types";
import { LIVE_TIMEOUT_MS, zodNote } from "./envelope";

const catalog = catalogJson as CatalogProduct[];
const neighbors = neighborsJson as Neighbor[];

export const ROSE_TEA = "Rose Tea Cafe";
export const FRYER_OIL_ID = "fryer-oil-35lb";

/** The demo centerpiece: neighbor members that must (and must not) be in the fryer oil group. */
const FRYER_EXPECTED_NEIGHBORS: [string, string][] = [
  ["Restaurant A", "Canola blend 35#"],
  ["Restaurant B", "Fry oil jug"],
  ["Restaurant C", "Clear fry 35 lb"],
  ["Restaurant D", "Fry oil jug"],
];
const FRYER_DECOYS = ["Olive oil 3L tin", "Vegetable shortening 50 lb cube", "Sesame oil 1 gal"];

type InputItem = { restaurant: string; rawName: string; monthlyQty: number; unit: string; unitPrice: number };

const key = (restaurant: string, rawName: string) => `${restaurant}\u0000${rawName}`;
const loose = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const isFryerOilName = (s: string) => /fry/i.test(s) && /oil/i.test(s);

function buildInputs(roseItems: LineItem[]): InputItem[] {
  const seen = new Set<string>();
  const out: InputItem[] = [];
  const push = (it: InputItem) => {
    const k = key(it.restaurant, it.rawName);
    if (seen.has(k)) return; // first occurrence wins
    seen.add(k);
    out.push(it);
  };
  for (const li of roseItems) {
    push({ restaurant: ROSE_TEA, rawName: li.rawName.trim(), monthlyQty: li.quantity, unit: li.unit, unitPrice: li.unitPrice });
  }
  for (const n of neighbors) for (const li of n.lineItems) push({ restaurant: n.label, ...li });
  return out;
}

function buildPrompt(inputs: InputItem[]) {
  const cat = catalog.map((c) => `${c.id} | ${c.name}, ${c.packSize} | ${c.description}`).join("\n");
  const restaurants = [ROSE_TEA, ...neighbors.map((n) => n.label)];
  const items = restaurants
    .map((r) => {
      const lines = inputs
        .filter((i) => i.restaurant === r)
        .map((i) => `- "${i.rawName}" | ${i.monthlyQty} ${i.unit}/mo | $${i.unitPrice.toFixed(2)}`)
        .join("\n");
      return `${r}:\n${lines}`;
    })
    .join("\n\n");

  return `You match restaurant purchase line items to a product catalog. Each restaurant's supplier names products differently.

CATALOG (id | product | description):
${cat}

LINE ITEMS (rawName | monthly qty | unit price):
${items}

Task: assign EVERY line item above to exactly one catalog id, or to null if no catalog product is the same product and pack size.
Be strict. These are NOT the same product and must NOT match: different oils (olive oil, sesame oil are not fryer oil), solid shortening (not liquid fryer oil), different cuts of meat (wings are not boneless thighs), different cup sizes or cup types (32 oz deli cup is not a 24 oz cold cup). Vague names (e.g. "Fry oil jug") can match when price and volume fit the catalog pack.

Return ONLY a JSON object, no prose, no code fences:
{"groups":[{"catalogId":"<catalog id or null>","members":[{"restaurant":"<exactly as written above, e.g. Restaurant A>","rawName":"<copied exactly>","reason":"<one short plain-English sentence citing the evidence: abbreviation decoded, pack size, or price>","confidence":<0-1>}]}]}
One group per catalogId, plus one group with "catalogId": null for unmatched items. Keep each reason under 20 words.`;
}

function normalizeRestaurant(r: unknown): string | null {
  if (typeof r !== "string") return null;
  const s = r.trim().toLowerCase().replace(/\s+/g, " ");
  if (s === "rose tea cafe" || s === "rose tea café" || s === "rose tea") return ROSE_TEA;
  const m = s.match(/^(?:restaurant\s*)?([a-d])$/);
  if (m) return `Restaurant ${m[1].toUpperCase()}`;
  return null;
}

/** Normalize the model output against the real inputs. Throws AiError on structural problems. */
function postProcess(raw: unknown, inputs: InputItem[]): MatchResult {
  const groupsRaw = (raw as { groups?: unknown })?.groups;
  if (!Array.isArray(groupsRaw)) throw new AiError("match output has no groups array");

  const byExact = new Map(inputs.map((i) => [key(i.restaurant, i.rawName), i]));
  const byLoose = new Map(inputs.map((i) => [key(i.restaurant, loose(i.rawName)), i]));
  const validIds = new Set(catalog.map((c) => c.id));

  const assigned = new Set<string>();
  const buckets = new Map<string | null, MatchMember[]>();
  let dropped = 0;

  for (const g of groupsRaw) {
    const gr = (g ?? {}) as { catalogId?: unknown; members?: unknown };
    let catalogId: string | null = typeof gr.catalogId === "string" ? gr.catalogId.trim() : null;
    if (catalogId && (catalogId.toLowerCase() === "null" || !validIds.has(catalogId))) catalogId = null;
    if (!Array.isArray(gr.members)) continue;

    for (const m of gr.members) {
      const mr = (m ?? {}) as Record<string, unknown>;
      const restaurant = normalizeRestaurant(mr.restaurant);
      const rawName = typeof mr.rawName === "string" ? mr.rawName : "";
      const input = restaurant
        ? (byExact.get(key(restaurant, rawName.trim())) ?? byLoose.get(key(restaurant, loose(rawName))))
        : undefined;
      if (!input) {
        dropped++;
        continue;
      }
      const k = key(input.restaurant, input.rawName);
      if (assigned.has(k)) continue; // an item can only be in one group; first assignment wins
      assigned.add(k);
      const conf = Number(mr.confidence);
      const member: MatchMember = {
        restaurant: input.restaurant,
        rawName: input.rawName, // canonical spelling from inputs
        monthlyQty: input.monthlyQty, // always the seeded / invoice value
        reason: typeof mr.reason === "string" && mr.reason.trim() ? mr.reason.trim() : "Matched on product name and pack size.",
        confidence: Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5,
      };
      if (!buckets.has(catalogId)) buckets.set(catalogId, []);
      buckets.get(catalogId)!.push(member);
    }
  }
  if (dropped) console.warn(`[api/match] dropped ${dropped} member(s) not present in the inputs`);

  // Anything the model skipped goes to the null group.
  const missing = inputs.filter((i) => !assigned.has(key(i.restaurant, i.rawName)));
  if (missing.length) {
    console.warn(`[api/match] model skipped ${missing.length} item(s); adding to unmatched`);
    if (!buckets.has(null)) buckets.set(null, []);
    for (const i of missing) {
      buckets.get(null)!.push({
        restaurant: i.restaurant,
        rawName: i.rawName,
        monthlyQty: i.monthlyQty,
        reason: "No confident catalog match.",
        confidence: 0.5,
      });
    }
  }

  const groups: MatchGroup[] = [];
  for (const c of catalog) {
    const members = buckets.get(c.id);
    if (members?.length) groups.push({ catalogId: c.id, members });
  }
  const nulls = buckets.get(null);
  if (nulls?.length) groups.push({ catalogId: null, members: nulls });

  const parsed = MatchResultSchema.safeParse({ groups });
  if (!parsed.success) throw new AiError(zodNote("match schema mismatch", parsed.error.issues));
  return parsed.data;
}

/** The fryer-oil group must be exactly Rose Tea's fryer line + the 4 scripted neighbor lines. */
function sanityCheck(result: MatchResult, roseItems: LineItem[]) {
  const roseFryer = roseItems.find((li) => isFryerOilName(li.rawName));
  if (!roseFryer) throw new AiError("match sanity check failed: Rose Tea has no FRY OIL line item");
  const expected = new Set([
    key(ROSE_TEA, roseFryer.rawName.trim()),
    ...FRYER_EXPECTED_NEIGHBORS.map(([r, n]) => key(r, n)),
  ]);
  const group = result.groups.find((g) => g.catalogId === FRYER_OIL_ID);
  const got = new Set((group?.members ?? []).map((m) => key(m.restaurant, m.rawName)));
  const problems: string[] = [];
  for (const k of expected) if (!got.has(k)) problems.push(`missing ${k.replace("\u0000", " / ")}`);
  for (const m of group?.members ?? []) {
    if (FRYER_DECOYS.includes(m.rawName)) problems.push(`decoy matched ${m.restaurant} / ${m.rawName}`);
    else if (!expected.has(key(m.restaurant, m.rawName))) problems.push(`extra ${m.restaurant} / ${m.rawName}`);
  }
  if (problems.length) throw new AiError(`match sanity check failed: ${problems.slice(0, 4).join("; ")}`);
}

export async function matchLive(roseItems: LineItem[]): Promise<MatchResult> {
  const inputs = buildInputs(roseItems);
  const raw = await chatJSON({
    model: matchModel(),
    timeoutMs: LIVE_TIMEOUT_MS,
    maxTokens: 4000,
    messages: [{ role: "user", content: buildPrompt(inputs) }],
  });
  let result: MatchResult;
  try {
    result = postProcess(raw, inputs);
  } catch (e) {
    console.warn("[api/match] post-process failed, raw:", JSON.stringify(raw).slice(0, 800));
    throw e;
  }
  sanityCheck(result, roseItems);
  return result;
}
