import { NextResponse } from "next/server";
import { readCustomerId } from "@/lib/auth";
import { readCart } from "@/lib/cart";
import { APP_ORIGIN } from "@/lib/customer-account/config";

/**
 * Gate in front of Shopify's hosted checkout.
 *
 * Checkout itself lives on Shopify, so the only place to require a sign-in
 * first is on the way out. Sending the visitor through `/account/authorize`
 * with `next` pointed back here means they land straight on checkout once
 * they have their one-time code, rather than back on the cart.
 */
export async function GET() {
  const home = (path: string) => NextResponse.redirect(new URL(path, APP_ORIGIN));

  if (!(await readCustomerId())) {
    return home("/account/authorize?next=/cart/checkout");
  }

  const cart = await readCart();
  if (!cart || cart.lines.length === 0) return home("/cart");

  return NextResponse.redirect(cart.checkoutUrl);
}
