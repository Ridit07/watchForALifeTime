import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_CLIENT_ID,
  REDIRECT_URI,
  SCOPES,
  endpoints,
} from "@/lib/customer-account/config";
import {
  codeChallenge,
  randomValue,
  saveHandshake,
} from "@/lib/customer-account/session";

/**
 * Starts sign-in. Builds the PKCE challenge, remembers the verifier for the
 * round trip, and hands the customer to Shopify's hosted screen where they
 * enter their email and the one-time code.
 */
export async function GET(request: NextRequest) {
  if (!CUSTOMER_CLIENT_ID) {
    return NextResponse.json(
      { error: "SHOPIFY_CUSTOMER_CLIENT_ID is not configured" },
      { status: 500 },
    );
  }

  const raw = request.nextUrl.searchParams.get("next") || "/account";
  // Only same-origin paths, so `next` cannot bounce anyone off-site.
  const returnTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";

  const verifier = randomValue();
  const state = randomValue(16);

  await saveHandshake(verifier, state, returnTo);

  const { authorize } = await endpoints();
  const url = new URL(authorize);
  url.searchParams.set("client_id", CUSTOMER_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await codeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(url);
}
