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
        className="pointer-events-none absolute right-0 top-0 h-[560px] w-[560px] translate-x-1/3 -translate-y-1/4 rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, var(--color-brass-light), transparent 65%)",
        }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-6 md:py-24">
        <div className="animate-rise">
          <p className="text-[11px] tracking-[0.25em] text-brass-light uppercase">
            One of Gurgaon&rsquo;s earliest watch showrooms
          </p>
          <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] font-light text-sand-50 sm:text-6xl">
            Timepieces worth
            <span className="block italic text-brass-light">a lifetime</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-light">
            {site.heritage}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/collections/all" className="btn btn-light">
              Explore the collection
            </Link>
            <Link href="/about" className="btn text-sand-200 hover:text-brass-light">
              Our story <ArrowIcon />
            </Link>
          </div>
        </div>

        {image && product && (
          <Link
            href={`/products/${product.handle}`}
            className="group relative mx-auto block w-full max-w-md"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={image.url}
                alt={image.altText || product.title}
                fill
                priority
                sizes="(min-width: 768px) 42vw, 90vw"
                className="object-contain transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:transform-none"
              />
            </div>
            <div className="mt-2 text-center md:text-left">
              <p className="text-[11px] tracking-[0.2em] text-brass-light uppercase">
                {titleCase(product.vendor)} · Featured
              </p>
              <p className="mt-2 font-display text-lg text-sand-50">
                {product.title}
              </p>
              <p className="mt-1 text-sm text-muted-light">
                {formatMoney(product.priceRange.minVariantPrice)}
              </p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
