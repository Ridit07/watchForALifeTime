"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { CART_COOKIE, getCartId, setCartId } from "@/lib/cart";
import { readCustomerId } from "@/lib/auth";
import { saveCartIdForCustomer } from "@/lib/customer-cart";
import {
  addCartLines,
  createCart,
  getCart,
  getVariantAvailability,
  removeCartLine,
  updateCartLine,
} from "@/lib/shopify";

export type CartActionState = { error?: string; ok?: boolean };

/**
 * Records a freshly made cart against the signed-in customer, so another
 * browser can find it. Best-effort: the cart works regardless.
 */
async function rememberCart(cartId: string): Promise<void> {
  try {
    const customerId = await readCustomerId();
    if (!customerId) return;

    await saveCartIdForCustomer(customerId, cartId);
  } catch {
    /* An unsaved association is not worth failing an add-to-bag over. */
  }
}

/** Returns a usable cart id, creating a cart if the visitor has none. */
async function ensureCartId(): Promise<string> {
  const existing = await getCartId();

  if (existing) {
    // Confirm Shopify still has it — ids go stale after checkout.
    try {
      const cart = await getCart(existing);
      if (cart) return existing;
    } catch {
      /* fall through and make a new one */
    }
  }

  const cart = await createCart();
  await setCartId(cart.id);
  await rememberCart(cart.id);
  return cart.id;
}

export async function addToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const merchandiseId = String(formData.get("merchandiseId") || "");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));

  if (!merchandiseId) return { error: "Please choose a variant first." };

  try {
    /* Stock is checked here rather than trusting the page, which is cached
       for an hour and may be advertising a piece that has since gone. */
    const stock = await getVariantAvailability(merchandiseId);
    if (!stock?.availableForSale) return { error: "That piece just sold out." };

    const cartId = await ensureCartId();
    const cart = await getCart(cartId);

    const existing = cart?.lines.find(
      (l) => l.merchandise.id === merchandiseId,
    );
    const wanted = (existing?.quantity ?? 0) + quantity;
    const limit = stock.quantityAvailable;

    if (limit !== null && wanted > limit) {
      return {
        error:
          existing
            ? `Only ${limit} in stock — your bag already has ${existing.quantity}.`
            : `Only ${limit} in stock.`,
      };
    }

    // Adding to a line Shopify already has would stack a duplicate entry.
    if (existing) await updateCartLine(cartId, existing.id, wanted);
    else await addCartLines(cartId, [{ merchandiseId, quantity }]);
  } catch (e) {
    return {
      error:
        e instanceof Error && /inventory|stock|available/i.test(e.message)
          ? "That piece just sold out."
          : "Could not add to the bag. Please try again.",
    };
  }

  refresh();
  return { ok: true };
}

export async function updateLineQuantity(
  lineId: string,
  quantity: number,
): Promise<CartActionState> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return { error: "Your bag has expired." };

  try {
    if (quantity < 1) {
      await removeCartLine(cartId, lineId);
    } else {
      const cart = await getCart(cartId);
      const line = cart?.lines.find((l) => l.id === lineId);

      if (line) {
        const stock = await getVariantAvailability(line.merchandise.id);
        const limit = stock?.quantityAvailable ?? null;
        if (limit !== null && quantity > limit) {
          return { error: `Only ${limit} in stock.` };
        }
      }

      await updateCartLine(cartId, lineId, quantity);
    }
  } catch {
    return { error: "Could not update the bag." };
  }

  refresh();
  return { ok: true };
}

export async function removeLine(lineId: string): Promise<CartActionState> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return { error: "Your bag has expired." };

  try {
    await removeCartLine(cartId, lineId);
  } catch {
    return { error: "Could not update the bag." };
  }

  refresh();
  return { ok: true };
}
