import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-4xl font-light text-ink">
        We could not find that page
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        The piece may have sold, or the link may have changed.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/collections/all" className="btn btn-primary">
          Explore the collection
        </Link>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
