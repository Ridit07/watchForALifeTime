import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/shopify/types";
import { discountPercent, formatMoney, titleCase } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange.maxVariantPrice;
  const off = discountPercent(price, compareAt);
  const hasRange =
    product.priceRange.minVariantPrice.amount !==
    product.priceRange.maxVariantPrice.amount;

  const primary = product.featuredImage ?? product.images[0] ?? null;
  const secondary = product.images.find((i) => i.url !== primary?.url) ?? null;

  const soldOut = !product.availableForSale;
  const lastOne =
    !soldOut &&
    typeof product.totalInventory === "number" &&
    product.totalInventory > 0 &&
    product.totalInventory <= 2;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block focus-visible:outline-none"
    >
      <div className="relative aspect-square overflow-hidden bg-tile">
        {primary ? (
          <>
            <Image
              src={primary.url}
              alt={primary.altText || product.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-contain p-5 transition-all duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            />
            {secondary && (
              <Image
                src={secondary.url}
                alt=""
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                aria-hidden
                className="object-contain p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:hidden"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-light">
            No image
          </div>
        )}

        {soldOut && (
          <span className="absolute left-0 top-4 bg-ink px-3 py-1.5 text-[10px] tracking-[0.15em] text-sand-100 uppercase">
            Sold out
          </span>
        )}
        {!soldOut && off !== null && (
          <span className="absolute left-0 top-4 bg-brass-dark px-3 py-1.5 text-[10px] tracking-[0.15em] text-sand-50 uppercase">
            {off}% off
          </span>
        )}
        {lastOne && off === null && (
          <span className="absolute left-0 top-4 bg-sand-50/90 px-3 py-1.5 text-[10px] tracking-[0.15em] text-ink uppercase">
            Last piece
          </span>
        )}
      </div>

      <div className="pt-4">
        {product.vendor && (
          <p className="eyebrow">{titleCase(product.vendor)}</p>
        )}
        <h3 className="mt-1.5 line-clamp-2 font-display text-[17px] leading-snug text-ink transition-colors group-hover:text-brass-dark">
          {product.title}
        </h3>
        <p className="mt-2 flex items-baseline gap-2 text-sm">
          <span className="font-medium text-ink">
            {hasRange && "From "}
            {formatMoney(price)}
          </span>
          {off !== null && (
            <span className="text-xs text-muted-light line-through">
              {formatMoney(compareAt)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
