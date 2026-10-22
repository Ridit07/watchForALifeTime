import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { ProductFilters, LoadMore } from "@/components/product-filters";
import { PageHeader } from "@/components/page-header";
import { CollectionSkeleton } from "@/components/skeletons";
import { getCollection, getCollections, getProducts, getVendors } from "@/lib/shopify";
import {
  facetOptions,
  matchesFacets,
  MAX_PRODUCTS,
  parseFilters,
  toShopifyQuery,
  type SearchParams,
} from "@/lib/filters";
import { titleCase } from "@/lib/utils";

/** `all` is a virtual collection — every product, not a Shopify collection. */
const ALL = "all";

export async function generateStaticParams() {
  const collections = await getCollections();
  return [{ handle: ALL }, ...collections.map((c) => ({ handle: c.handle }))];
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params;

  if (handle === ALL) {
    return {
      title: "All Watches",
      description: "The complete collection, from everyday to occasion.",
      alternates: { canonical: "/collections/all" },
    };
  }

  const collection = await getCollection(handle);
  if (!collection) return { title: "Not found" };

  return {
    title: collection.seo.title || titleCase(collection.title),
    description: collection.seo.description || collection.description,
    alternates: { canonical: `/collections/${handle}` },
  };
}

type Params = PageProps<"/collections/[handle]">["params"];

async function CollectionView({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<SearchParams>;
}) {
  const [{ handle }, sp] = await Promise.all([params, searchParams]);
  const filters = parseFilters(sp);

  /* A real Shopify collection is narrowed with its own handle rather than
     fetched whole and filtered here, so the work stays server-side and the
     grid scales past a few hundred pieces. */
  const scope = handle === ALL ? undefined : `collection:${handle}`;

  /* Facets are applied here rather than in the query, so when one is in
     play the whole page has to come down before it can be narrowed. */
  const facetsActive = Object.keys(filters.facets).length > 0;

  const [fetched, vendors, collection] = await Promise.all([
    getProducts({
      first: facetsActive ? MAX_PRODUCTS : filters.first,
      sortKey: filters.sort.sortKey,
      reverse: filters.sort.reverse,
      query: toShopifyQuery(filters, scope),
    }),
    getVendors(),
    handle === ALL ? Promise.resolve(null) : getCollection(handle),
  ]);

  if (handle !== ALL && !collection) notFound();

  const options = facetOptions(fetched);
  const matched = facetsActive
    ? fetched.filter((p) => matchesFacets(p, filters.facets))
    : fetched;
  const products = matched.slice(0, filters.first);

  const title = collection ? titleCase(collection.title) : "All Watches";
  const description =
    collection?.description ||
    "The complete collection — every piece currently on our shelves.";

  return (
    <>
      <PageHeader eyebrow="Collection" title={title} intro={description} />

      <section className="shell py-14 md:py-20">
        <ProductFilters
          vendors={vendors}
          facetOptions={options}
          total={matched.length}
          active={filters.active}
        />

        <div className="pt-10">
          <ProductGrid products={products} />
        </div>

        {/* `first` was asked for; a full page back means there is likely more. */}
        <LoadMore
          shown={filters.first}
          hasMore={matched.length > products.length}
        />
      </section>
    </>
  );
}

export default function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[handle]">) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <CollectionView params={params} searchParams={searchParams} />
    </Suspense>
  );
}
