import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-36 text-center md:py-48">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-4xl font-light text-sand-50">
        We could not find that page
      </h1>
      <p className="mt-6 text-sm leading-[1.9] text-muted-light">
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
