import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2026-10";

const ENDPOINT = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;

/**
 * Admin API request. Unlike the Storefront client this one never throws, so
 * a dead token degrades rather than breaks: cart persistence is a convenience
 * on top of a cart that already works, and a missing invoice simply reads as
 * "not issued yet".
 *
 * That silence is the hazard — a revoked token and an empty result look
 * identical to callers — so every failure is logged server-side even though
 * the return value is the same null.
 */
export async function adminFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T | null> {
  if (!DOMAIN || !TOKEN) {
    console.warn(
      "[shopify/admin] SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN is not set",
    );
    return null;
  }

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

    if (!res.ok) {
      console.warn(`[shopify/admin] HTTP ${res.status} from the Admin API`);
      return null;
    }

    const json = (await res.json()) as {
      data?: T;
      errors?: unknown;
    };

    // Admin returns `errors` as an array of objects, or a bare string for
    // auth failures. Either way there is no usable data.
    if (json.errors) {
      console.warn("[shopify/admin] rejected:", JSON.stringify(json.errors));
      return null;
    }

    return json.data ?? null;
  } catch (error) {
    console.warn("[shopify/admin] request failed:", error);
    return null;
  }
}
