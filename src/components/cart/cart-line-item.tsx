"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { CartLine } from "@/lib/shopify/types";
import { formatMoney, titleCase } from "@/lib/utils";
import { removeLine, updateLineQuantity } from "./actions";

export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { merchandise } = line;

  /* Null means Shopify is not tracking stock for this variant, so there is
     no ceiling to enforce. */
  const limit = merchandise.quantityAvailable;
  const atLimit = limit !== null && line.quantity >= limit;
  const soldOut = !merchandise.availableForSale;

  const setQuantity = (quantity: number) =>
    startTransition(async () => {
      setError(null);
      const result = await updateLineQuantity(line.id, quantity);
      if (result?.error) setError(result.error);
    });

  const hasRealOptions = merchandise.title !== "Default Title";

  return (
    <li
      className={
        "flex gap-7 py-9 transition-opacity " + (pending ? "opacity-50" : "")
      }
    >
      <Link
        href={`/products/${merchandise.product.handle}`}
        className="relative h-32 w-28 shrink-0 overflow-hidden bg-tile"
      >
        {merchandise.image && (
          <Image
            src={merchandise.image.url}
            alt={merchandise.image.altText || merchandise.product.title}
            fill
            sizes="112px"
            className="object-contain"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{titleCase(merchandise.product.vendor)}</p>
            <h3 className="mt-1 text-sm leading-snug text-sand-50">
              <Link
                href={`/products/${merchandise.product.handle}`}
                className="hover:text-brass-light"
              >
                {merchandise.product.title}
              </Link>
            </h3>
            {hasRealOptions && (
              <p className="mt-1 text-xs text-muted-light">{merchandise.title}</p>
            )}
          </div>
          <p className="shrink-0 text-sm text-sand-50">
            {formatMoney(line.cost.totalAmount)}
          </p>
        </div>

        {(error || atLimit || soldOut) && (
          <p
            role={error ? "alert" : undefined}
            className={
              "mt-2 text-xs " + (error || soldOut ? "text-red-800" : "text-muted-light")
            }
          >
            {error ??
              (soldOut
                ? "Out of stock — please remove to check out."
                : `Only ${limit} in stock`)}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="flex items-center border border-sand-50/20">
            <button
              type="button"
              onClick={() => setQuantity(line.quantity - 1)}
              disabled={pending}
              aria-label="Decrease quantity"
              className="px-3 py-1.5 text-muted-light transition-colors hover:text-sand-50 disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm text-sand-50">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(line.quantity + 1)}
              disabled={pending || atLimit || soldOut}
              aria-label="Increase quantity"
              title={atLimit && limit !== null ? `Only ${limit} in stock` : undefined}
              className="px-3 py-1.5 text-muted-light transition-colors hover:text-sand-50 disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                void removeLine(line.id);
              })
            }
            className="text-xs tracking-wider text-muted-light uppercase underline underline-offset-4 transition-colors hover:text-sand-50 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
