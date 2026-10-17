"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { addToCart, removeLine, updateLineQuantity } from "./actions";
import type { CartActionState } from "./actions";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import { cx, formatMoney } from "@/lib/utils";
import { CheckIcon } from "../icons";

/** What the bag already holds for a given variant. */
export type CartEntry = { lineId: string; quantity: number };

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn btn-primary w-full"
    >
      {pending ? "Adding…" : label}
    </button>
  );
}

/**
 * Replaces the add button once the variant is in the bag. Quantity is capped
 * at what Shopify says is left, so the last piece cannot be added twice.
 */
function QuantityStepper({
  entry,
  limit,
}: {
  entry: CartEntry;
  limit: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const atLimit = limit !== null && entry.quantity >= limit;

  const set = (quantity: number) =>
    startTransition(async () => {
      setError(null);
      const result =
        quantity < 1
          ? await removeLine(entry.lineId)
          : await updateLineQuantity(entry.lineId, quantity);
      if (result?.error) setError(result.error);
    });

  return (
    <div>
      <div
        className={cx(
          "flex items-stretch justify-between border border-ink transition-opacity",
          pending && "opacity-50",
        )}
      >
        <button
          type="button"
          onClick={() => set(entry.quantity - 1)}
          disabled={pending}
          aria-label={
            entry.quantity === 1 ? "Remove from bag" : "Decrease quantity"
          }
          className="px-5 py-3 text-lg leading-none text-ink transition-colors hover:bg-sand-200 disabled:opacity-40"
        >
          −
        </button>

        <span
          aria-live="polite"
          className="flex flex-1 items-center justify-center text-sm tracking-wider text-ink"
        >
          {entry.quantity} in bag
        </span>

        <button
          type="button"
          onClick={() => set(entry.quantity + 1)}
          disabled={pending || atLimit}
          aria-label="Increase quantity"
          className="px-5 py-3 text-lg leading-none text-ink transition-colors hover:bg-sand-200 disabled:opacity-30"
        >
          +
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs">
        <span className="text-muted">
          {error ? (
            <span role="alert" className="text-red-800">
              {error}
            </span>
          ) : atLimit ? (
            `That's all ${limit} we have`
          ) : (
            <span className="flex items-center gap-1.5 text-brass-dark">
              <CheckIcon />
              Added to your bag
            </span>
          )}
        </span>

        <Link
          href="/cart"
          className="shrink-0 tracking-[0.15em] text-muted uppercase underline underline-offset-4 hover:text-ink"
        >
          View bag
        </Link>
      </div>
    </div>
  );
}

export function AddToCart({
  product,
  entries = {},
}: {
  product: Product;
  /** Keyed by variant id — what the visitor's bag already holds. */
  entries?: Record<string, CartEntry>;
}) {
  const variants = product.variants;

  /* Shopify gives single-variant products one "Default Title" variant — there
     is nothing for the customer to choose, so no picker is shown. */
  const isSingleVariant =
    variants.length === 1 && variants[0].title === "Default Title";

  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.availableForSale) ?? variants[0])?.id ?? "",
  );

  const [state, formAction] = useActionState<CartActionState, FormData>(
    addToCart,
    {},
  );

  const selected: ProductVariant | undefined =
    variants.find((v) => v.id === selectedId) ?? variants[0];

  const soldOut = !selected?.availableForSale;
  const limit = selected?.quantityAvailable ?? null;
  const inBag = selected ? entries[selected.id] : undefined;

  return (
    <div className="mt-8">
      {!isSingleVariant && product.options.length > 0 && (
        <div className="mb-7 space-y-5">
          {product.options.map((option) => (
            <fieldset key={option.id}>
              <legend className="eyebrow mb-3">{option.name}</legend>
              <div className="flex flex-wrap gap-2">
                {option.optionValues.map((value) => {
                  const match = variants.find((v) =>
                    v.selectedOptions.some(
                      (o) => o.name === option.name && o.value === value.name,
                    ),
                  );
                  const unavailable = !match?.availableForSale;
                  const isActive = selected?.selectedOptions.some(
                    (o) => o.name === option.name && o.value === value.name,
                  );

                  return (
                    <button
                      key={value.name}
                      type="button"
                      disabled={!match}
                      onClick={() => match && setSelectedId(match.id)}
                      className={cx(
                        "border px-4 py-2 text-xs tracking-wider uppercase transition-colors",
                        isActive
                          ? "border-ink bg-ink text-sand-50"
                          : "border-sand-400 text-ink hover:border-ink",
                        unavailable && "line-through opacity-40",
                      )}
                    >
                      {value.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {selected && !isSingleVariant && (
        <p className="mb-5 text-lg font-medium text-ink">
          {formatMoney(selected.price)}
        </p>
      )}

      {inBag ? (
        <QuantityStepper entry={inBag} limit={limit} />
      ) : (
        <>
          <form action={formAction}>
            <input
              type="hidden"
              name="merchandiseId"
              value={selected?.id ?? ""}
            />
            <input type="hidden" name="quantity" value="1" />
            <SubmitButton
              disabled={soldOut}
              label={soldOut ? "Sold out" : "Add to bag"}
            />
          </form>

          {state.error && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {state.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
