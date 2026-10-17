import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2026-10";

const ENDPOINT = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;

/**
 * Admin API request. Unlike the Storefront client this one never throws:
 * the only caller is cart persistence, which is a convenience on top of a
 * cart that already works. A failed write must not break adding to the bag.
 *
 * Returns null when the credentials are missing or Shopify refuses.
 */
export async function adminFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T | null> {
  if (!DOMAIN || !TOKEN) return null;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: T;
      errors?: unknown;
    };

    // Admin returns `errors` as an array of objects, or a bare string for
    // auth failures. Either way there is no usable data.
    if (json.errors) return null;

    return json.data ?? null;
  } catch {
    return null;
  }
}
