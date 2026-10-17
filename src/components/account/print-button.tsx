"use client";

/** Separate from the PDF download — this one is for paper. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs tracking-[0.15em] text-muted uppercase underline underline-offset-4 hover:text-ink"
    >
      Print
    </button>
  );
}
