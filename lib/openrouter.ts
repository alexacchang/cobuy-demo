// SERVER ONLY. Import this module only from route handlers / lib/server/*.
// It reads OPENROUTER_API_KEY from process.env, which must never reach the browser.
// (The "server-only" npm package isn't installed, so this is enforced by convention.)

// OPENROUTER_BASE_URL is only for local testing against a mock server.
const endpoint = () =>
  `${(process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1").replace(/\/$/, "")}/chat/completions`;
const DEFAULT_MODEL = "google/gemini-2.5-flash";

export const extractModel = () => process.env.EXTRACT_MODEL?.trim() || DEFAULT_MODEL;
export const matchModel = () => process.env.MATCH_MODEL?.trim() || DEFAULT_MODEL;

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

/** Error with a short, human-readable reason that ends up in the envelope's `note`. */
export class AiError extends Error {}

export async function chatJSON(opts: {
  model: string;
  messages: ChatMessage[];
  timeoutMs: number;
  maxTokens?: number;
}): Promise<unknown> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new AiError("no OPENROUTER_API_KEY");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  let text: string;
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cobuy.demo",
        "X-Title": "CoBuy demo",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: 0,
        response_format: { type: "json_object" },
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      throw new AiError(`OpenRouter HTTP ${res.status}: ${truncate(raw, 200)}`);
    }
    let body: { choices?: { message?: { content?: unknown } }[]; error?: { message?: string } };
    try {
      body = JSON.parse(raw);
    } catch {
      throw new AiError(`OpenRouter returned non-JSON body: ${truncate(raw, 200)}`);
    }
    if (body.error) throw new AiError(`OpenRouter error: ${truncate(body.error.message ?? "", 200)}`);
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new AiError(`empty model response: ${truncate(raw, 200)}`);
    }
    text = content;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (ctrl.signal.aborted) throw new AiError(`timeout after ${opts.timeoutMs} ms`);
    throw new AiError(`network error: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  return parseJsonLoose(text);
}

/** Strip code fences / leading prose and parse. Logs the raw text (truncated) on failure. */
export function parseJsonLoose(text: string): unknown {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    console.warn("[openrouter] could not parse model output:", truncate(text, 800));
    throw new AiError("model returned invalid JSON");
  }
}

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
