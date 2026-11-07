"use client";

export default function PrintButton() {
  return (
    <button type="button" className="inv-print-btn" onClick={() => window.print()}>
      Print
    </button>
  );
}
