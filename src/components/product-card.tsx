"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product, ShopifyImage } from "@/lib/shopify/types";
import { cx, discountPercent, formatMoney, titleCase } from "@/lib/utils";

/** How long each frame holds while the pointer is over the card. */
const FRAME_MS = 900;

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

  /* Featured first, then the rest of the gallery with it de-duplicated. */
  const featured = product.featuredImage ?? product.images[0] ?? null;
  const gallery: ShopifyImage[] = featured
    ? [featured, ...product.images.filter((i) => i.url !== featured.url)]
    : product.images;

  const soldOut = !product.availableForSale;
  const lastOne =
    !soldOut &&
    typeof product.totalInventory === "number" &&
    product.totalInventory > 0 &&
    product.totalInventory <= 2;

  const [frame, setFrame] = useState(0);
  /* The extra frames are only mounted after the first hover. Rendering
     every image of every card up front would pull the whole catalogue's
     photography on a grid of hundreds. */
  const [primed, setPrimed] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const canCycle = gallery.length > 1;

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = () => {
    if (!canCycle || timer.current) return;

    // Someone who asked for less motion gets the second shot, not a slideshow.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPrimed(true);
      setFrame(1);
      return;
    }

    setPrimed(true);
    timer.current = setInterval(
      () => setFrame((f) => (f + 1) % gallery.length),
      FRAME_MS,
    );
  };

  const reset = () => {
    stop();
    setFrame(0);
  };

  // Clear on unmount, so a filter change mid-hover cannot leak a timer.
  useEffect(() => stop, []);

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block focus-visible:outline-none"
      onMouseEnter={start}
      onMouseLeave={reset}
      onFocus={start}
      onBlur={reset}
    >
      <div className="relative aspect-square overflow-hidden bg-tile">
        {gallery.length ? (
          <>
            {gallery.map((image, i) => {
              // Mount frame 0 always; the rest once the card has been hovered.
              if (i > 0 && !primed) return null;

              return (
                <Image
                  key={image.url}
                  src={image.url}
                  alt={i === 0 ? image.altText || product.title : ""}
                  aria-hidden={i !== 0}
                  fill
                  priority={i === 0 && priority}
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className={cx(
                    "object-contain transition-opacity duration-500 ease-out",
                    i === frame ? "opacity-100" : "opacity-0",
                  )}
                />
              );
            })}

            {/* A gentle lift on the whole tile, independent of which frame shows */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-light">
            No image
          </div>
        )}

        {canCycle && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            {gallery.map((image, i) => (
              <span
                key={image.url}
                className={cx(
                  "h-1 w-5 transition-colors duration-300",
                  i === frame ? "bg-ink/70" : "bg-ink/20",
                )}
              />
            ))}
          </div>
        )}

        {soldOut && (
          <span className="absolute left-0 top-5 bg-ink px-3.5 py-1.5 text-[10px] tracking-[0.2em] text-sand-100 uppercase">
            Sold out
          </span>
        )}
        {!soldOut && off !== null && (
          <span className="absolute left-0 top-5 bg-brass-dark px-3.5 py-1.5 text-[10px] tracking-[0.2em] text-sand-50 uppercase">
            {off}% off
          </span>
        )}
        {lastOne && off === null && (
          <span className="absolute left-0 top-5 bg-sand-50/95 px-3.5 py-1.5 text-[10px] tracking-[0.2em] text-olive uppercase">
            Last piece
          </span>
        )}
      </div>

      <div className="pt-6">
        {product.vendor && (
          <p className="eyebrow">{titleCase(product.vendor)}</p>
        )}
        <h3 className="mt-3 line-clamp-2 font-display text-[19px] leading-snug font-light text-sand-50 transition-colors group-hover:text-brass-light">
          {product.title}
        </h3>
        <p className="mt-3 flex items-baseline gap-2.5 text-sm">
          <span className="font-medium text-sand-50">
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
