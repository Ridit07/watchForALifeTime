import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/shopify/types";
import { site } from "@/lib/site";
import { formatMoney, titleCase } from "@/lib/utils";
import { ArrowIcon } from "./icons";

export function Hero({ product }: { product: Product | null }) {
  const image = product?.featuredImage ?? product?.images[0] ?? null;

  return (
    <section className="relative overflow-hidden bg-ink text-sand-100">
      {/* Brass wash behind the watch, so the dark hero doesn't read flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[720px] w-[720px] translate-x-1/3 -translate-y-1/4 rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, var(--color-brass-light), transparent 65%)",
        }}
      />

      <div className="shell section relative">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-24">
          <div className="animate-rise">
            <p className="eyebrow">Est. 1982 · Gurugram</p>
            <h1 className="mt-8 font-display text-[3rem] leading-[1.02] font-light text-sand-50 sm:text-[4.25rem] lg:text-[4.75rem]">
              Timepieces worth
              <span className="mt-2 block italic text-brass-light">
                a lifetime
              </span>
            </h1>
            <div aria-hidden className="mt-10 h-px w-20 bg-sand-400" />
            <p className="mt-10 max-w-md text-[15px] leading-[1.9] text-muted-light">
              {site.heritage}
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/collections/all" className="btn btn-primary">
                Explore the collection
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2.5 text-[11px] tracking-luxe text-sand-200 uppercase transition-colors hover:text-brass-light"
              >
                Our story
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {image && product && (
            <Link
              href={`/products/${product.handle}`}
              className="group block animate-fade"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-tile">
                <Image
                  src={image.url}
                  alt={image.altText || product.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:transform-none"
                />
              </div>
              <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div>
                  <p className="text-[10px] tracking-[0.28em] text-brass-light uppercase">
                    {titleCase(product.vendor)} · Best seller
                  </p>
                  <p className="mt-2.5 font-display text-xl font-light text-sand-50">
                    {product.title}
                  </p>
                </div>
                <p className="text-sm text-muted-light">
                  {formatMoney(product.priceRange.minVariantPrice)}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
