export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-16 md:grid-cols-3 md:gap-x-10 md:gap-y-20 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-charcoal" />
          <div className="mt-6 h-2.5 w-16 bg-charcoal" />
          <div className="mt-3 h-3.5 w-full bg-charcoal" />
          <div className="mt-2 h-3.5 w-2/3 bg-charcoal" />
          <div className="mt-3 h-3 w-20 bg-charcoal" />
        </div>
      ))}
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="shell grid animate-pulse gap-14 py-14 md:py-20 lg:grid-cols-2 lg:gap-24">
      <div className="aspect-square bg-charcoal" />
      <div className="space-y-4 py-6">
        <div className="h-3 w-20 bg-charcoal" />
        <div className="h-8 w-4/5 bg-charcoal" />
        <div className="h-5 w-28 bg-charcoal" />
        <div className="h-28 w-full bg-charcoal" />
        <div className="h-12 w-full bg-charcoal" />
      </div>
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <>
      <header className="border-b border-sand-50/10 bg-olive py-20 text-center md:py-28">
        <div className="shell-prose animate-pulse">
          <div className="mx-auto h-2.5 w-24 bg-sand-50/10" />
          <div className="mx-auto mt-7 h-11 w-72 bg-sand-50/10" />
          <div className="mx-auto mt-8 h-4 w-full max-w-md bg-sand-50/[0.07]" />
        </div>
      </header>

      <section className="shell py-14 md:py-20">
        <div className="mb-10 h-3 w-20 animate-pulse bg-charcoal" />
        <GridSkeleton />
      </section>
    </>
  );
}
