"use client";

import { useState } from "react";
import { Button, cx } from "@/components/ui";

export function QuoteButton({ prominent }: { prominent?: boolean }) {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-green px-4 py-2.5 text-base font-semibold text-green animate-rise-in">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Quote sent
      </span>
    );
  }
  return (
    <Button variant={prominent ? "primary" : "secondary"} className={cx("whitespace-nowrap px-4 py-2.5")} onClick={() => setSent(true)}>
      Send quote
    </Button>
  );
}
