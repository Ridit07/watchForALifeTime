"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-32 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-display text-3xl font-light text-sand-50">
        We hit a problem loading this page
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-light">
        This is usually temporary. Try again in a moment.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-10">
        Try again
      </button>
    </div>
  );
}
