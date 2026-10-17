"use client";

import Image from "next/image";
import { useState } from "react";
import type { ShopifyImage } from "@/lib/shopify/types";
import { cx } from "@/lib/utils";

export function ProductGallery({
  images,
  title,
}: {
  images: ShopifyImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center bg-tile text-sm text-muted-light">
        No image available
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden bg-tile">
        <Image
          key={current.url}
          src={current.url}
          alt={current.altText || title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="animate-fade object-contain p-6"
        />
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={cx(
                  "relative aspect-square w-full overflow-hidden bg-tile transition-all",
                  i === active
                    ? "ring-1 ring-brass"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="12vw"
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
