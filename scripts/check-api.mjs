#!/usr/bin/env node
// Quick smoke test for the AI routes. Plain Node 18+, no deps.
//   BASE_URL=http://localhost:3000 npm run check:api
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLE = join(ROOT, "public", "sample-invoice.png");
const cachedExtract = JSON.parse(readFileSync(join(ROOT, "data/cached/extract.json"), "utf8"));

const FRYER_ID = "fryer-oil-35lb";
const EXPECTED_NEIGHBORS = [
  ["Restaurant A", "Canola blend 35#"],
  ["Restaurant B", "Fry oil jug"],
  ["Restaurant C", "Clear fry 35 lb"],
  ["Restaurant D", "Fry oil jug"],
];
const DECOYS = ["Olive oil 3L tin", "Vegetable shortening 50 lb cube", "Sesame oil 1 gal"];

const results = []; // { name, status: "PASS" | "FAIL" | "WARN" | "SKIP", detail }
const record = (name, status, detail = "") => {
  results.push({ name, status, detail });
  console.log(`  -> ${status}${detail ? `: ${detail}` : ""}\n`);
};

async function call(path, init) {
  const t0 = Date.now();
  const res = await fetch(BASE + path, init);
  const wall = Date.now() - t0;
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text, wall };
}

function envelopeProblems(r) {
  const p = [];
  if (r.status !== 200) p.push(`HTTP ${r.status}`);
  const e = r.json;
  if (!e || typeof e !== "object") return [...p, `non-JSON body: ${r.text.slice(0, 120)}`];
  if (!["live", "cached", "fallback"].includes(e.source)) p.push(`bad source ${e.source}`);
  if (typeof e.ms !== "number") p.push("ms missing");
  if (!e.data || typeof e.data !== "object") p.push("data missing");
  return p;
}

function extractShapeProblems(d) {
  const p = [];
  if (typeof d?.supplier !== "string") p.push("supplier");
  if (typeof d?.invoiceDate !== "string") p.push("invoiceDate");
  if (!Array.isArray(d?.lineItems) || d.lineItems.length === 0) p.push("lineItems empty");
  else
    d.lineItems.forEach((li, i) => {
      if (typeof li.rawName !== "string") p.push(`lineItems.${i}.rawName`);
      for (const k of ["quantity", "unitPrice", "lineTotal"]) if (typeof li[k] !== "number") p.push(`lineItems.${i}.${k}`);
      if (typeof li.unit !== "string") p.push(`lineItems.${i}.unit`);
    });
  return p;
}

function fryerReport(data, roseItems) {
  const g = data?.groups?.find((x) => x.catalogId === FRYER_ID);
  const members = g?.members ?? [];
  const roseFryer = roseItems.find((li) => /fry/i.test(li.rawName) && /oil/i.test(li.rawName));
  const expected = [["Rose Tea Cafe", roseFryer?.rawName ?? "(none)"], ...EXPECTED_NEIGHBORS];
  const has = (r, n) => members.some((m) => m.restaurant === r && m.rawName === n);
  const missing = expected.filter(([r, n]) => !has(r, n)).map(([r, n]) => `${r} / ${n}`);
  const decoys = members.filter((m) => DECOYS.includes(m.rawName)).map((m) => `${m.restaurant} / ${m.rawName}`);
  return { members, missing, decoys, ok: members.length === 5 && missing.length === 0 && decoys.length === 0 };
}

function printMembers(members) {
  for (const m of members) console.log(`     ${m.restaurant.padEnd(14)} ${m.rawName.padEnd(26)} qty ${m.monthlyQty}  conf ${m.confidence}  "${m.reason}"`);
}

const isWarnFallback = (e) => e.source === "fallback";

async function main() {
  console.log(`CoBuy API check against ${BASE}\n`);

  // 1. extract, cached
  console.log("[1] POST /api/extract (x-use-cache: 1)");
  try {
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array([0])], { type: "image/png" }), "x.png");
    const r = await call("/api/extract", { method: "POST", body: fd, headers: { "x-use-cache": "1" } });
    const p = [...envelopeProblems(r)];
    if (r.json?.source !== "cached") p.push(`source=${r.json?.source}`);
    p.push(...extractShapeProblems(r.json?.data));
    if (r.wall < 1300 || r.wall > 4000) p.push(`took ${r.wall} ms (want ~1500)`);
    console.log(`     source=${r.json?.source} ms=${r.json?.ms} wall=${r.wall}ms items=${r.json?.data?.lineItems?.length}`);
    record("extract cached", p.length ? "FAIL" : "PASS", p.join(", "));
  } catch (e) {
    record("extract cached", "FAIL", e.message);
  }

  // 2. match, cached
  console.log("[2] POST /api/match (x-use-cache: 1)");
  try {
    const r = await call("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json", "x-use-cache": "1" },
      body: JSON.stringify({ lineItems: cachedExtract.lineItems }),
    });
    const p = [...envelopeProblems(r)];
    if (r.json?.source !== "cached") p.push(`source=${r.json?.source}`);
    const f = fryerReport(r.json?.data, cachedExtract.lineItems);
    if (!f.ok) p.push(`fryer group: ${f.members.length} members, missing [${f.missing.join("; ")}], decoys [${f.decoys.join("; ")}]`);
    if (r.wall < 1300 || r.wall > 4000) p.push(`took ${r.wall} ms (want ~1500)`);
    console.log(`     source=${r.json?.source} ms=${r.json?.ms} wall=${r.wall}ms fryer members=${f.members.length}`);
    record("match cached", p.length ? "FAIL" : "PASS", p.join(", "));
  } catch (e) {
    record("match cached", "FAIL", e.message);
  }

  // 3. extract, live
  console.log("[3] POST /api/extract (live, public/sample-invoice.png)");
  let liveItems = cachedExtract.lineItems;
  if (!existsSync(SAMPLE)) {
    record("extract live", "SKIP", "public/sample-invoice.png not found");
  } else {
    try {
      const fd = new FormData();
      fd.append("file", new Blob([readFileSync(SAMPLE)], { type: "image/png" }), "sample-invoice.png");
      const r = await call("/api/extract", { method: "POST", body: fd });
      const p = [...envelopeProblems(r), ...extractShapeProblems(r.json?.data)];
      const e = r.json ?? {};
      console.log(`     source=${e.source} model=${e.model ?? "-"} ms=${e.ms} items=${e.data?.lineItems?.length}${e.note ? ` note="${e.note}"` : ""}`);
      if (e.source === "live") {
        liveItems = e.data.lineItems;
        for (const li of liveItems) console.log(`     ${li.rawName.padEnd(36)} ${li.quantity} ${li.unit} @ ${li.unitPrice} = ${li.lineTotal}`);
      }
      if (p.length) record("extract live", "FAIL", p.join(", "));
      else if (isWarnFallback(e)) record("extract live", "WARN", `fell back to cache (${e.note})`);
      else record("extract live", "PASS");
    } catch (e) {
      record("extract live", "FAIL", e.message);
    }
  }

  // 4. match, live
  console.log("[4] POST /api/match (live)");
  try {
    const r = await call("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lineItems: liveItems }),
    });
    const p = [...envelopeProblems(r)];
    const e = r.json ?? {};
    const f = fryerReport(e.data, e.source === "live" ? liveItems : cachedExtract.lineItems);
    console.log(`     source=${e.source} model=${e.model ?? "-"} ms=${e.ms}${e.note ? ` note="${e.note}"` : ""}`);
    console.log(`     fryer group (${f.members.length}):`);
    printMembers(f.members);
    if (f.decoys.length) console.log(`     DECOYS wrongly matched: ${f.decoys.join("; ")}`);
    if (f.missing.length) console.log(`     missing: ${f.missing.join("; ")}`);
    if (!f.ok) p.push("fryer group is not the scripted 5");
    if (p.length) record("match live", "FAIL", p.join(", "));
    else if (isWarnFallback(e)) record("match live", "WARN", `fell back to cache (${e.note})`);
    else record("match live", "PASS");
  } catch (e) {
    record("match live", "FAIL", e.message);
  }

  console.log("Summary");
  for (const r of results) console.log(`  ${r.status.padEnd(4)}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n${failed ? `FAIL (${failed} failed)` : "PASS"}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("FAIL:", e.message, `(is the server running at ${BASE}?)`);
  process.exit(1);
});
