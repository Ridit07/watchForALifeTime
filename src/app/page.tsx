import Link from "next/link";
import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { Assurances } from "@/components/assurances";
import { LogoMark } from "@/components/logo";
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
    <section className="shell section">
      <SectionHeading eyebrow="Browse" title="Shop by brand" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.handle}
            href={`/collections/${c.handle}`}
            className="group relative flex min-h-56 items-end overflow-hidden border border-sand-50/10 bg-olive p-9 text-sand-50 transition-colors duration-500 hover:border-brass/40"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 70% 25%, var(--color-brass-light), transparent 60%)",
              }}
            />
            <div className="relative">
              <h3 className="font-display text-[1.75rem] font-light">
                {titleCase(c.title)}
              </h3>
              <p className="mt-3 text-[10px] tracking-[0.28em] text-brass-light uppercase">
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
    <section className="border-y border-sand-50/10 bg-olive">
      <div className="shell-prose section-tall text-center">
        <LogoMark height={44} className="mx-auto h-11 w-auto" />
        <p className="eyebrow mt-10">Our story</p>
        <h2 className="mt-6 font-display text-[2.25rem] leading-[1.25] font-light text-sand-50 sm:text-[3rem]">
          A showroom built on trust, one watch at a time
        </h2>
        <div aria-hidden className="rule mx-auto my-12 w-24" />
        <p className="text-[15px] leading-[2] text-muted-light">
          {site.heritage}
        </p>
        <p className="mt-7 text-[15px] leading-[2] text-muted-light">
          Three generations on, the counter still works the same way: handle the
          watch, learn how it is made, and choose the one you will still be
          wearing in twenty years.
        </p>
        <Link href="/about" className="btn btn-outline mt-14">
          Read our story
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="h-[640px] bg-ink" />}>
        <HeroSection />
      </Suspense>

      <Assurances />

      <section className="shell section">
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
