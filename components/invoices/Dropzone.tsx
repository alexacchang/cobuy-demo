"use client";
import { useRef, useState } from "react";
import { cx } from "@/components/ui";

const ACCEPT = ["image/png", "image/jpeg"];

export function isAcceptedImage(f: File) {
  return ACCEPT.includes(f.type) || /\.(png|jpe?g)$/i.test(f.name);
}

/** Large click-or-drop target for a PNG/JPG invoice. */
export function Dropzone({ onFile, compact = false }: { onFile: (f: File) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [bad, setBad] = useState(false);

  function take(f: File | undefined | null) {
    if (!f) return;
    if (!isAcceptedImage(f)) {
      setBad(true);
      return;
    }
    setBad(false);
    onFile(f);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files?.[0]);
      }}
      className={cx(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors outline-none focus-visible:border-green",
        compact ? "px-6 py-6" : "px-10 py-20",
        over ? "border-green bg-mint-soft" : "border-ink/20 bg-card hover:border-green/60",
      )}
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <svg width={compact ? 32 : 52} height={compact ? 32 : 52} viewBox="0 0 48 48" fill="none" aria-hidden className="text-green">
        <rect x="9" y="5" width="30" height="38" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M16 16h16M16 23h16M16 30h9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="9" fill="#F7F6F2" stroke="currentColor" strokeWidth="2.5" />
        <path d="M36 40.5v-9M32 35l4-4 4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={cx("font-display font-semibold text-ink", compact ? "mt-3 text-lg" : "mt-5 text-2xl")}>
        {over ? "Drop to upload" : "Drop a supplier invoice here"}
      </div>
      <div className={cx("text-muted", compact ? "mt-1 text-base" : "mt-2 text-lg")}>
        or <span className="font-semibold text-green underline decoration-green/30 underline-offset-4">choose a file</span> · PNG or JPG
      </div>
      {bad && <div className="mt-3 text-base font-medium text-amber">Please choose a PNG or JPG image.</div>}
    </div>
  );
}
