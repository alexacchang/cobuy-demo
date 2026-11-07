"use client";
import type { ApiEnvelope, ExtractResult, LineItem, MatchResult } from "./types";

/** Browser-side wrappers. The API routes never fail (they fall back to cache), but we guard anyway. */
export async function extractInvoice(file: File, useCache: boolean): Promise<ApiEnvelope<ExtractResult>> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/extract", {
    method: "POST",
    body,
    headers: useCache ? { "x-use-cache": "1" } : {},
  });
  if (!res.ok) throw new Error(`extract failed: ${res.status}`);
  return res.json();
}

export async function matchItems(lineItems: LineItem[], useCache: boolean): Promise<ApiEnvelope<MatchResult>> {
  const res = await fetch("/api/match", {
    method: "POST",
    body: JSON.stringify({ lineItems }),
    headers: { "content-type": "application/json", ...(useCache ? { "x-use-cache": "1" } : {}) },
  });
  if (!res.ok) throw new Error(`match failed: ${res.status}`);
  return res.json();
}
