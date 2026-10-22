import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCartSection } from "@/components/cart/add-to-cart-section";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { GridSkeleton, ProductSkeleton } from "@/components/skeletons";
import { getProduct, getProductHandles, getProducts } from "@/lib/shopify";
import { assurances, MRP_FIELD, site, specFields } from "@/lib/site";
import {
  discountPercent,
  findMetafield,
  formatMoney,
  resolveMetafield,
  titleCase,
} from "@/lib/utils";

export async function generateStaticParams() {
  const handles = await getProductHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: "Not found" };

  const image = product.featuredImage?.url;

  return {
    title: product.seo.title || product.title,
    description:
      product.seo.description || product.description.slice(0, 160),
    openGraph: {
      title: product.seo.title || product.title,
      description: product.seo.description || product.description.slice(0, 160),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    alternates: { canonical: `/products/${product.handle}` },
  };
}

type Params = PageProps<"/products/[handle]">["params"];

async function RelatedProducts({ params }: { params: Params }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return null;

  const products = await getProducts({
    first: 8,
    query: product.vendor ? `vendor:${product.vendor}` : undefined,
  });

  const related = products.filter((p) => p.handle !== handle).slice(0, 4);
  if (!related.length) return null;

  return (
    <section className="shell section">
      <SectionHeading
        eyebrow="You may also like"
        title="More from the collection"
        href="/collections/all"
      />
      <ProductGrid products={related} priorityCount={0} />
    </section>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) notFound();

  const price = product.priceRange.minVariantPrice;

  /* Shopify's compare-at price is the usual source for a strikethrough, but
     this catalogue records the list price as a `custom.mrp` metafield instead.
     Whichever is higher than the selling price wins. */
  const mrpRaw = resolveMetafield(
    findMetafield(product.metafields, MRP_FIELD.namespace, MRP_FIELD.key),
  );
  const mrp =
    mrpRaw && Number(mrpRaw) > Number(price.amount)
      ? { amount: mrpRaw, currencyCode: price.currencyCode }
      : null;

  const shopifyCompareAt = product.compareAtPriceRange.maxVariantPrice;
  const compareAt =
    Number(shopifyCompareAt.amount) > Number(price.amount)
      ? shopifyCompareAt
      : mrp;
  const off = compareAt ? discountPercent(price, compareAt) : null;

  const specs = specFields
    .map((f) => ({
      label: f.label,
      key: `${f.namespace}.${f.key}`,
      value: resolveMetafield(
        findMetafield(product.metafields, f.namespace, f.key),
      ),
    }))
    .filter((f): f is typeof f & { value: string } => Boolean(f.value));

  const inStock =
    typeof product.totalInventory === "number" ? product.totalInventory : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: titleCase(product.vendor) },
    offers: {
      "@type": "Offer",
      price: price.amount,
      priceCurrency: price.currencyCode,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${site.url}/products/${product.handle}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="shell pt-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-light">
          <ol className="flex flex-wrap items-center gap-2.5 text-[11px] tracking-wider uppercase">
            <li>
              <Link href="/" className="hover:text-brass-light">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/collections/all" className="hover:text-brass-light">
                Watches
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-sand-50">{product.title}</li>
          </ol>
        </nav>
      </div>

      <article className="shell grid gap-14 py-14 md:py-20 lg:grid-cols-2 lg:gap-24">
        <ProductGallery images={product.images} title={product.title} />

        <div className="lg:pt-2">
          {product.vendor && (
            <p className="eyebrow">{titleCase(product.vendor)}</p>
          )}
          <h1 className="mt-5 font-display text-[2.25rem] leading-tight font-light text-sand-50 sm:text-[3rem]">
            {product.title}
          </h1>

          <div className="mt-8 flex flex-wrap items-baseline gap-4">
            <p className="text-[1.75rem] font-light text-sand-50">{formatMoney(price)}</p>
            {off !== null && (
              <>
                <p className="text-base text-muted-light line-through">
                  {formatMoney(compareAt)}
                </p>
                <span className="bg-brass-dark px-2.5 py-1 text-[10px] tracking-[0.2em] text-sand-50 uppercase">
                  {off}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">Inclusive of all taxes</p>

          {product.availableForSale ? (
            inStock !== null && inStock <= 3 ? (
              <p className="mt-6 text-sm text-brass">
                Only {inStock} {inStock === 1 ? "piece" : "pieces"} left
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-light">In stock</p>
            )
          ) : (
            <p className="mt-6 text-sm text-muted-light">
              Currently unavailable — contact the showroom for availability.
            </p>
          )}

          <Suspense
            fallback={
              <div className="mt-10 h-14 w-full animate-pulse bg-charcoal" />
            }
          >
            <AddToCartSection product={product} />
          </Suspense>

          {product.descriptionHtml && (
            <div className="mt-14 border-t border-sand-50/10 pt-10">
              <h2 className="eyebrow mb-6">Details</h2>
              <div
                className="rte text-[15px]"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            </div>
          )}

          {specs.length > 0 && (
            <div className="mt-14 border-t border-sand-50/10 pt-10">
              <h2 className="eyebrow mb-6">Specification</h2>
              <dl className="divide-y divide-sand-50/10 text-sm">
                {specs.map((s) => (
                  <div key={s.key} className="flex justify-between gap-8 py-4">
                    <dt className="text-muted-light">{s.label}</dt>
                    <dd className="text-right text-sand-50">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <ul className="mt-14 grid gap-8 border-t border-sand-50/10 pt-10 sm:grid-cols-2">
            {assurances.map((a) => (
              <li key={a.title}>
                <p className="text-[13px] font-medium text-sand-50">{a.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-light">
                  {a.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </article>

    </>
  );
}

/* `params` is URL data, so awaiting it in the page body would block the
   navigation. Each branch reads it behind its own boundary instead, letting
   the shell paint immediately while the product streams in. */
export default function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  return (
    <>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
      <Suspense fallback={<GridSkeleton count={4} />}>
        <RelatedProducts params={params} />
      </Suspense>
    </>
  );
}
