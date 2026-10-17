import "server-only";
import { cookies } from "next/headers";
import { getCart } from "./shopify";
import type { Cart } from "./shopify/types";

export const CART_COOKIE = "cartId";

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14, // Shopify expires abandoned carts around 10 days
};

export async function getCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

export async function setCartId(cartId: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, cartId, CART_COOKIE_OPTIONS);
}

/**
 * Reads the cart for the current visitor. Returns null when there is no cart
 * cookie, or when Shopify no longer recognises the id (carts expire, and a
 * completed checkout retires its cart).
 */
export async function readCart(): Promise<Cart | null> {
  const cartId = await getCartId();
  if (!cartId) return null;

  try {
    return await getCart(cartId);
  } catch {
    // A stale or malformed id should empty the cart, not break the page.
    return null;
  }
}
