import "server-only";

/**
 * Shopify's New Customer Accounts: OAuth 2.0 with PKCE against a public
 * client. There is no password anywhere in this flow — the customer proves
 * who they are with a one-time code on Shopify's hosted screen, and we
 * receive an authorization code on the way back.
 *
 * Endpoints are published at the shop's `.well-known` documents rather than
 * being fixed, so they are discovered once and cached for the process.
 */
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

export const CUSTOMER_CLIENT_ID = process.env.SHOPIFY_CUSTOMER_CLIENT_ID;

/** Shopify requires HTTPS here, which is why dev runs with a self-signed cert. */
export const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "https://localhost:3000";

export const REDIRECT_URI = `${APP_ORIGIN}/account/callback`;

/** `openid` for the id token, `email` to read it, the rest for orders. */
export const SCOPES = "openid email customer-account-api:full";

type Endpoints = {
  authorize: string;
  token: string;
  logout: string;
  graphql: string;
};

let cached: Endpoints | null = null;

export async function endpoints(): Promise<Endpoints> {
  if (cached) return cached;

  if (!DOMAIN) {
    throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  }

  const [openid, api] = await Promise.all([
    fetch(`https://${DOMAIN}/.well-known/openid-configuration`, {
      cache: "force-cache",
    }).then((r) => r.json()),
    fetch(`https://${DOMAIN}/.well-known/customer-account-api`, {
      cache: "force-cache",
    }).then((r) => r.json()),
  ]);

  cached = {
    authorize: openid.authorization_endpoint,
    token: openid.token_endpoint,
    logout: openid.end_session_endpoint,
    graphql: api.graphql_api,
  };

  return cached;
}
