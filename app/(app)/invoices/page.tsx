"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import neighbors from "@/data/neighbors.json";
import { Card, PageHeader, SourceTag, cx } from "@/components/ui";
import { Dropzone, isAcceptedImage } from "@/components/invoices/Dropzone";
import { LineItemTable, ROW_STAGGER_MS } from "@/components/invoices/LineItemTable";
import { InsightCard } from "@/components/invoices/InsightCard";
import { ErrorLine, StatusLine } from "@/components/invoices/StatusLine";
import { useHydrated } from "@/components/invoices/useHydrated";
import { extractInvoice, matchItems } from "@/lib/ai-client";
import { useDemo } from "@/lib/demo-store";
import { ROSE_TEA, fryerOilInsight } from "@/lib/insight";

const NEARBY = neighbors.length;

function fmtDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InvoicesPage() {
  const ready = useHydrated();
  const { useCachedAi, invoiceFileName, invoicePreview, extract, match, revealDone, set } = useDemo();

  const fileRef = useRef<File | null>(null);
  const runId = useRef(0);
  const matchingRef = useRef(false);
  const replaceInput = useRef<HTMLInputElement>(null);
  const insightRef = useRef<HTMLDivElement>(null);

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [freshMatch, setFreshMatch] = useState(false);
  const [sampleError, setSampleError] = useState(false);

  async function runExtract(file: File) {
    const id = runId.current;
    setExtractError(null);
    setExtracting(true);
    try {
      const res = await extractInvoice(file, useCachedAi);
      if (id !== runId.current) return;
      set({ extract: res });
    } catch (e) {
      console.error(e);
      if (id === runId.current) setExtractError("CoBuy couldn't read that invoice.");
    } finally {
      if (id === runId.current) setExtracting(false);
    }
  }

  function start(file: File) {
    runId.current += 1;
    fileRef.current = file;
    if (invoicePreview) URL.revokeObjectURL(invoicePreview);
    setMatchError(null);
    setFreshMatch(false);
    set({
      invoiceFileName: file.name,
      invoicePreview: URL.createObjectURL(file),
      extract: null,
      match: null,
      revealDone: false,
    });
    void runExtract(file);
  }

  async function loadSample() {
    setSampleError(false);
    try {
      const r = await fetch("/sample-invoice.png");
      if (!r.ok) throw new Error(String(r.status));
      const b = await r.blob();
      start(new File([b], "sample-invoice.png", { type: b.type || "image/png" }));
    } catch (e) {
      console.error(e);
      setSampleError(true);
    }
  }

  // Finish the staggered reveal, then mark it done so it never replays.
  useEffect(() => {
    if (!ready || !extract || revealDone) return;
    const n = extract.data.lineItems.length;
    const t = setTimeout(() => set({ revealDone: true }), (n + 1) * ROW_STAGGER_MS + 450);
    return () => clearTimeout(t);
  }, [ready, extract, revealDone, set]);

  // After the reveal: compare with neighbors automatically.
  useEffect(() => {
    if (!ready || !extract || !revealDone || match || matchError || matching || matchingRef.current) return;
    const id = runId.current;
    matchingRef.current = true;
    setMatching(true);
    matchItems(extract.data.lineItems, useCachedAi)
      .then((res) => {
        if (id !== runId.current) return;
        setFreshMatch(true);
        set({ match: res });
      })
      .catch((e) => {
        console.error(e);
        if (id === runId.current) setMatchError("Couldn't compare with nearby restaurants.");
      })
      .finally(() => {
        matchingRef.current = false;
        setMatching(false);
      });
  }, [ready, extract, revealDone, match, matchError, matching, useCachedAi, set]);

  const insight = useMemo(() => (match ? fryerOilInsight(match.data) : null), [match]);
  const highlightName = insight?.group.members.find((m) => m.restaurant === ROSE_TEA)?.rawName ?? null;

  // Keep the hand-off in view on the projector: scroll when comparing starts and when the insight lands.
  useEffect(() => {
    if (!matching && !(freshMatch && match)) return;
    const raf = requestAnimationFrame(() => insightRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    return () => cancelAnimationFrame(raf);
  }, [matching, freshMatch, match]);

  if (!ready) return null;

  const hasFile = !!invoiceFileName;
  const lostUpload = hasFile && !extract && !extracting && !extractError;

  return (
    <div>
      <PageHeader
        eyebrow="Step 1"
        title="Invoices"
        subtitle="CoBuy reads your supplier invoices line by line, so you never retype them."
        right={
          hasFile ? (
            <>
              <button
                onClick={() => replaceInput.current?.click()}
                className="mb-1 shrink-0 rounded-lg px-3 py-2 text-base font-medium text-muted transition-colors hover:bg-card hover:text-ink"
              >
                Upload a different invoice
              </button>
              <input
                ref={replaceInput}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f && isAcceptedImage(f)) start(f);
                }}
              />
            </>
          ) : undefined
        }
      />

      {!hasFile && (
        <div>
          <Dropzone onFile={start} />
          <div className="mt-3 text-center text-sm text-muted/70">
            Need a sample?{" "}
            <a href="/sample-invoice" target="_blank" rel="noreferrer" className="underline decoration-muted/30 underline-offset-2 hover:text-ink">
              Open sample invoice
            </a>{" "}
            or{" "}
            <button onClick={loadSample} className="underline decoration-muted/30 underline-offset-2 hover:text-ink">
              use it directly
            </button>
            {sampleError && <span className="ml-2 text-amber">Sample not found.</span>}
          </div>
        </div>
      )}

      {hasFile && (
        <div className="grid grid-cols-[280px_1fr] items-start gap-6">
          {/* Invoice image */}
          <Card className="p-3">
            {invoicePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={invoicePreview} alt="Uploaded invoice" className="max-h-[520px] w-full rounded-lg border border-line object-contain object-top" />
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-lg bg-paper text-muted">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 2.5h8l4.5 4.5v14.5H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M14 2.5V7h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div className="mt-2.5 truncate px-1 font-mono text-sm text-muted" title={invoiceFileName ?? undefined}>
              {invoiceFileName}
            </div>
          </Card>

          {/* Results */}
          <Card className="min-h-[320px] p-0">
            {!extract && (
              <div className="p-6">
                {extracting && (
                  <>
                    <StatusLine>Reading invoice…</StatusLine>
                    <div className="mt-6 space-y-3" aria-hidden>
                      {[92, 78, 85, 70, 88, 64].map((w, i) => (
                        <div key={i} className="h-5 animate-pulse rounded bg-paper" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
                      ))}
                    </div>
                  </>
                )}
                {extractError && (
                  <ErrorLine message={extractError} onRetry={fileRef.current ? () => void runExtract(fileRef.current!) : undefined} />
                )}
                {(lostUpload || (extractError && !fileRef.current)) && (
                  <div className="mt-4">
                    <Dropzone onFile={start} compact />
                  </div>
                )}
              </div>
            )}

            {extract && (
              <>
                <div className="flex items-end justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Supplier</div>
                    <div className="font-display mt-0.5 text-2xl font-semibold text-ink">{extract.data.supplier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Invoice date</div>
                    <div className="num mt-0.5 text-lg font-medium text-ink">{fmtDate(extract.data.invoiceDate)}</div>
                  </div>
                </div>
                <div className="px-2">
                  <LineItemTable items={extract.data.lineItems} animate={!revealDone} highlightName={insight ? highlightName : null} />
                </div>
                <div className="flex justify-end px-6 pb-3 pt-1">
                  <SourceTag source={extract.source} ms={extract.ms} />
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Step 2 hand-off */}
      {extract && revealDone && (
        <div ref={insightRef} className="mt-6 scroll-mb-8">
          {!match && matching && (
            <div className="rounded-2xl border border-line bg-card px-6 py-5">
              <StatusLine>Comparing with {NEARBY} restaurants nearby…</StatusLine>
            </div>
          )}
          {!match && matchError && <ErrorLine message={matchError} onRetry={() => setMatchError(null)} />}
          {match && insight && (
            <>
              <InsightCard insight={insight} animate={freshMatch} />
              <div className={cx("mt-2 flex justify-end", freshMatch && "animate-rise-in")}>
                <SourceTag source={match.source} ms={match.ms} />
              </div>
            </>
          )}
          {match && !insight && (
            <div className="rounded-2xl border border-line bg-card px-6 py-5 text-lg text-muted">
              CoBuy compared your items with {NEARBY} nearby restaurants.{" "}
              <a href="/matches" className="font-semibold text-green underline underline-offset-4">
                See matches
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
