import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { CollectionSkeleton } from "@/components/skeletons";
import { getCollection, getCollections, getProducts } from "@/lib/shopify";
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

async function CollectionView({ params }: { params: Params }) {
  const { handle } = await params;

  const data =
    handle === ALL
      ? {
          title: "All Watches",
          description:
            "The complete collection — every piece currently on our shelves.",
          products: await getProducts({ first: 100, sortKey: "BEST_SELLING" }),
        }
      : await getCollection(handle);

  if (!data) notFound();

  return (
    <>
      <header className="bg-ink py-16 text-center text-sand-100">
        <div className="mx-auto max-w-2xl px-4">
          <p className="eyebrow text-brass-light">Collection</p>
          <h1 className="mt-3 font-display text-4xl font-light text-sand-50 sm:text-5xl">
            {titleCase(data.title)}
          </h1>
          {data.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-muted-light">
              {data.description}
            </p>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="mb-8 text-xs tracking-[0.15em] text-muted uppercase">
          {data.products.length}{" "}
          {data.products.length === 1 ? "piece" : "pieces"}
        </p>
        <ProductGrid products={data.products} />
      </section>
    </>
  );
}

/* Reading `params` here would block the navigation, so the body sits behind a
   boundary and the skeleton paints while the collection loads. */
export default function CollectionPage({
  params,
}: PageProps<"/collections/[handle]">) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <CollectionView params={params} />
    </Suspense>
  );
}
