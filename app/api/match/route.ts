import cachedMatch from "@/data/cached/match.json";
import { AiError, matchModel } from "@/lib/openrouter";
import { runAi, zodNote } from "@/lib/server/envelope";
import { matchLive } from "@/lib/server/match";
import { MatchRequestSchema, type MatchResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return runAi<MatchResult>({
    req,
    label: "match",
    cached: cachedMatch as MatchResult,
    model: matchModel(),
    live: async () => {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new AiError("request body is not JSON");
      }
      const parsed = MatchRequestSchema.safeParse(body);
      if (!parsed.success) throw new AiError(zodNote("bad match request", parsed.error.issues));
      return matchLive(parsed.data.lineItems);
    },
  });
}
