"use client";
import { Button } from "@/components/ui";

/** Calm "working" line: a softly pulsing mint dot, no spinner. */
export function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-lg font-medium text-ink" role="status" aria-live="polite">
      <span className="relative flex h-3 w-3" aria-hidden>
        <span className="absolute inset-0 animate-ping rounded-full bg-mint opacity-60 [animation-duration:1.6s]" />
        <span className="relative h-3 w-3 rounded-full bg-green" />
      </span>
      {children}
    </div>
  );
}

export function ErrorLine({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber/25 bg-amber-soft px-4 py-3 text-base text-amber" role="alert">
      <span className="font-medium">{message}</span>
      {onRetry && (
        <Button variant="secondary" className="ml-auto px-4 py-2 text-sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
