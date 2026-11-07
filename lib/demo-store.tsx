"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ApiEnvelope, ExtractResult, MatchResult } from "./types";

export type DemoState = {
  useCachedAi: boolean;
  invoiceFileName: string | null;
  invoicePreview: string | null; // object URL, not persisted
  extract: ApiEnvelope<ExtractResult> | null;
  match: ApiEnvelope<MatchResult> | null;
  revealDone: boolean; // staggered line-item reveal finished (so it doesn't replay on revisit)
  joined: boolean; // joined the fryer oil offer
  delivery: "door" | "pickup";
};

const initial: DemoState = {
  useCachedAi: false,
  invoiceFileName: null,
  invoicePreview: null,
  extract: null,
  match: null,
  revealDone: false,
  joined: false,
  delivery: "door",
};

type Ctx = DemoState & {
  set: (patch: Partial<DemoState>) => void;
  reset: () => void; // back to the start; keeps the useCachedAi toggle
};

const DemoContext = createContext<Ctx | null>(null);
const KEY = "cobuy-demo-v1";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(initial);

  // Restore after a page refresh so a reload on stage doesn't lose progress.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw), invoicePreview: null });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const { invoicePreview: _omit, ...rest } = state;
      void _omit;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {}
  }, [state]);

  const set = useCallback((patch: Partial<DemoState>) => setState((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setState((s) => ({ ...initial, useCachedAi: s.useCachedAi })), []);

  const value = useMemo(() => ({ ...state, set, reset }), [state, set, reset]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): Ctx {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
