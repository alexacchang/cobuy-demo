// SERVER ONLY (imported by app/api/* route handlers).
import { NextResponse } from "next/server";
import { AiError } from "@/lib/openrouter";
import type { AiSource, ApiEnvelope } from "@/lib/types";

export const CACHE_DELAY_MS = 1500; // cached / fallback responses take at least this long so they look live
export const LIVE_TIMEOUT_MS = 12_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const wantsCache = (req: Request) => req.headers.get("x-use-cache") === "1";

function respond<T>(data: T, source: AiSource, t0: number, extra: { model?: string; note?: string } = {}) {
  const env: ApiEnvelope<T> = { data, source, ms: Date.now() - t0, ...extra };
  return NextResponse.json(env, { headers: { "cache-control": "no-store" } });
}

/**
 * Shared flow for both AI routes: cache toggle → cached; otherwise run `live`;
 * any thrown error → cached data with source "fallback" and a short note.
 */
export async function runAi<T>(opts: {
  req: Request;
  label: string;
  cached: T;
  model: string;
  live: () => Promise<T>;
}) {
  const t0 = Date.now();
  if (wantsCache(opts.req)) {
    await sleep(CACHE_DELAY_MS);
    return respond(opts.cached, "cached", t0);
  }
  try {
    const data = await opts.live();
    return respond(data, "live", t0, { model: opts.model });
  } catch (e) {
    const note = e instanceof AiError ? e.message : `unexpected error: ${(e as Error)?.message ?? String(e)}`;
    console.warn(`[api/${opts.label}] falling back to cache: ${note}`);
    const left = CACHE_DELAY_MS - (Date.now() - t0);
    if (left > 0) await sleep(left);
    return respond(opts.cached, "fallback", t0, { note });
  }
}

/** zod error → short one-line note */
export function zodNote(prefix: string, issues: { path: PropertyKey[]; message: string }[]) {
  const first = issues
    .slice(0, 3)
    .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  return `${prefix}: ${first}`;
}
