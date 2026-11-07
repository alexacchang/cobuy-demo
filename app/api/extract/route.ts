import cachedExtract from "@/data/cached/extract.json";
import { AiError, extractModel } from "@/lib/openrouter";
import { runAi } from "@/lib/server/envelope";
import { extractLive, readImageFile } from "@/lib/server/extract";
import type { ExtractResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return runAi<ExtractResult>({
    req,
    label: "extract",
    cached: cachedExtract as ExtractResult,
    model: extractModel(),
    live: async () => {
      let form: FormData;
      try {
        form = await req.formData();
      } catch {
        throw new AiError("request is not multipart/form-data");
      }
      const { dataUrl } = await readImageFile(form);
      return extractLive(dataUrl);
    },
  });
}
