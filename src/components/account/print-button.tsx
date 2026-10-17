"use client";

/** Separate from the PDF download — this one is for paper. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
    >
      Print
    </button>
  );
}
