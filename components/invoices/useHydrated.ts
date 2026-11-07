"use client";
import { useEffect, useState } from "react";

/**
 * True after the first client commit. DemoProvider restores localStorage in its own
 * mount effect, which React batches with this one, so the first `true` render already
 * sees the restored demo state (no empty-state flash after a refresh).
 */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
