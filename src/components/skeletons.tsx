export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-sand-200" />
          <div className="mt-4 h-2.5 w-16 bg-sand-200" />
          <div className="mt-3 h-3.5 w-full bg-sand-200" />
          <div className="mt-2 h-3.5 w-2/3 bg-sand-200" />
          <div className="mt-3 h-3 w-20 bg-sand-200" />
        </div>
      ))}
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl animate-pulse gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="aspect-square bg-sand-200" />
      <div className="space-y-4 py-6">
        <div className="h-3 w-20 bg-sand-200" />
        <div className="h-8 w-4/5 bg-sand-200" />
        <div className="h-5 w-28 bg-sand-200" />
        <div className="h-28 w-full bg-sand-200" />
        <div className="h-12 w-full bg-sand-200" />
      </div>
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <>
      <header className="bg-ink py-16 text-center text-sand-100">
        <div className="mx-auto max-w-2xl animate-pulse px-4">
          <div className="mx-auto h-2.5 w-24 bg-sand-100/15" />
          <div className="mx-auto mt-5 h-9 w-72 bg-sand-100/15" />
          <div className="mx-auto mt-6 h-4 w-full max-w-md bg-sand-100/10" />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 h-3 w-20 animate-pulse bg-sand-200" />
        <GridSkeleton />
      </section>
    </>
  );
}
