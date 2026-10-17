import Link from "next/link";
import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { Assurances } from "@/components/assurances";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { GridSkeleton } from "@/components/skeletons";
import { getCollections, getProducts } from "@/lib/shopify";
import { site } from "@/lib/site";
import { titleCase } from "@/lib/utils";

/** Shopify ranks BEST_SELLING by units sold, so the hero is the real one. */
async function HeroSection() {
  const products = await getProducts({ first: 1, sortKey: "BEST_SELLING" });
  return <Hero product={products[0] ?? null} />;
}

async function FeaturedProducts() {
  const products = await getProducts({ first: 8, sortKey: "BEST_SELLING" });
  return <ProductGrid products={products} />;
}

async function CollectionStrip() {
  const collections = await getCollections();
  if (!collections.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="Browse" title="Shop by brand" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.handle}
            href={`/collections/${c.handle}`}
            className="group relative flex min-h-44 items-end overflow-hidden bg-ink p-7 text-sand-50"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-35"
              style={{
                background:
                  "radial-gradient(circle at 70% 25%, var(--color-brass-light), transparent 60%)",
              }}
            />
            <div className="relative">
              <h3 className="font-display text-2xl">{titleCase(c.title)}</h3>
              <p className="mt-1.5 text-[11px] tracking-[0.18em] text-brass-light uppercase">
                Explore
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Heritage() {
  return (
    <section className="bg-charcoal/60">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="eyebrow">Our story</p>
        <h2 className="mt-4 font-display text-3xl font-light leading-snug text-sand-50 sm:text-[2.5rem]">
          A showroom built on trust, one watch at a time
        </h2>
        <div aria-hidden className="rule mx-auto my-8 w-24" />
        <p className="text-[15px] leading-[1.9] text-muted-light">{site.heritage}</p>
        <p className="mt-5 text-[15px] leading-[1.9] text-muted-light">
          Three generations on, the counter still works the same way: handle the
          watch, learn how it is made, and choose the one you will still be
          wearing in twenty years.
        </p>
        <Link href="/about" className="btn btn-outline mt-10">
          Read our story
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="h-[520px] bg-ink" />}>
        <HeroSection />
      </Suspense>

      <Assurances />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Most loved"
          title="Best sellers"
          href="/collections/all"
        />
        <Suspense fallback={<GridSkeleton count={8} />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      <Heritage />

      <Suspense fallback={null}>
        <CollectionStrip />
      </Suspense>
    </>
  );
}
