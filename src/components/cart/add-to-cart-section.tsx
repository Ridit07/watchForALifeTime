import { connection } from "next/server";
import { readCart } from "@/lib/cart";
import type { Product } from "@/lib/shopify/types";
import { AddToCart, type CartEntry } from "./add-to-cart";

/**
 * Reads the visitor's bag so the product page can show a quantity stepper in
 * place of the add button for anything already in it. Split from the page so
 * the cookie read sits behind its own boundary and the rest of the product
 * stays in the static shell.
 */
export async function AddToCartSection({ product }: { product: Product }) {
  await connection();

  const cart = await readCart();

  const entries: Record<string, CartEntry> = {};
  for (const line of cart?.lines ?? []) {
    entries[line.merchandise.id] = {
      lineId: line.id,
      quantity: line.quantity,
    };
  }

  return <AddToCart product={product} entries={entries} />;
}
