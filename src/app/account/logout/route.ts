import { NextResponse } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { APP_ORIGIN, endpoints } from "@/lib/customer-account/config";
import {
  SESSION_COOKIES,
  readIdToken,
} from "@/lib/customer-account/session";

/**
 * Ends the session here and at Shopify. Without the second part the customer
 * stays signed in to Shopify and the next sign-in skips the code entirely,
 * which looks broken on a shared machine.
 */
export async function GET() {
  const idToken = await readIdToken();

  const target = idToken
    ? await (async () => {
        const { logout } = await endpoints();
        const url = new URL(logout);
        url.searchParams.set("id_token_hint", idToken);
        url.searchParams.set("post_logout_redirect_uri", APP_ORIGIN);
        return url;
      })()
    : new URL("/", APP_ORIGIN);

  const response = NextResponse.redirect(target);

  /* The bag goes with the session. Only the cookie is dropped — the cart
     itself stays on Shopify, still pointed at by the customer metafield, so
     signing back in hands it straight back. What this prevents is the next
     person on a shared machine inheriting someone else's bag.

     Cleared on the response itself rather than through `cookies()`: this
     handler returns a brand new response, and deletions made on the request
     store do not reliably travel with it. */
  for (const name of [...SESSION_COOKIES, CART_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
