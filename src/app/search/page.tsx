import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { GridSkeleton } from "@/components/skeletons";
import { getProducts } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Search",
  description: "Find a watch by name, brand or style.",
};

type SearchParams = PageProps<"/search">["searchParams"];

const readQuery = async (sp: SearchParams) => {
  const { q } = await sp;
  return typeof q === "string" ? q.trim() : "";
};

/* searchParams is a promise under Cache Components: everything that reads it
   sits inside Suspense so the page shell still prerenders. */

async function SearchField({ searchParams }: { searchParams: SearchParams }) {
  const query = await readQuery(searchParams);

  return (
    <input
      id="q"
      name="q"
      type="search"
      defaultValue={query}
      placeholder="Search by brand, style or name…"
      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-sand-50 placeholder:text-muted-light focus:outline-none"
    />
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const query = await readQuery(searchParams);

  if (!query) {
    const products = await getProducts({ first: 12, sortKey: "BEST_SELLING" });
    return (
      <>
        <p className="mb-10 text-[11px] tracking-luxe text-muted-light uppercase">
          Popular right now
        </p>
        <ProductGrid products={products} />
      </>
    );
  }

  const products = await getProducts({ first: 48, query });

  return (
    <>
      <p className="mb-10 text-[11px] tracking-luxe text-muted-light uppercase">
        {products.length} {products.length === 1 ? "result" : "results"} for
        &ldquo;{query}&rdquo;
      </p>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="py-28 text-center text-sm text-muted-light">
          Nothing matched that. Try a brand name such as Titan, or a style like
          &ldquo;leather&rdquo;.
        </p>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="shell py-16 md:py-24">
      <p className="eyebrow">The catalogue</p>
      <h1 className="mt-5 font-display text-[2.5rem] leading-tight font-light text-sand-50 sm:text-5xl">
        Search
      </h1>

      <form action="/search" className="mt-12 max-w-xl">
        <label htmlFor="q" className="sr-only">
          Search watches
        </label>
        <div className="flex border border-sand-50/20 bg-ink-soft">
          <Suspense
            fallback={
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Search by brand, style or name…"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-sand-50 placeholder:text-muted-light focus:outline-none"
              />
            }
          >
            <SearchField searchParams={searchParams} />
          </Suspense>
          <button
            type="submit"
            className="px-7 text-[11px] tracking-luxe text-sand-50 uppercase transition-colors hover:bg-brass-dark"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mt-20">
        <Suspense fallback={<GridSkeleton count={8} />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
