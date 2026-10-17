import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2026-10";

if (!DOMAIN || !TOKEN) {
  throw new Error(
    "Missing Shopify credentials. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local — see SETUP.md.",
  );
}

const ENDPOINT = `https://${DOMAIN}/api/${VERSION}/graphql.json`;

type GraphQLError = { message: string; path?: string[] };

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly query: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

/**
 * Storefront API request. Callers decide caching:
 * catalog reads run inside `"use cache"` functions, cart mutations pass
 * `noStore` so they always hit the network.
 */
export async function shopifyFetch<T>({
  query,
  variables,
  noStore = false,
}: {
  query: string;
  variables?: Record<string, unknown>;
  noStore?: boolean;
}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
      ...(noStore ? { cache: "no-store" as const } : {}),
    });
  } catch (cause) {
    throw new ShopifyError(
      `Could not reach Shopify at ${DOMAIN}`,
      query,
      cause,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // 401/403 almost always means the token is wrong or lacks a scope.
    throw new ShopifyError(
      `Shopify returned ${res.status} ${res.statusText}`,
      query,
      body.slice(0, 500),
    );
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: GraphQLError[];
  };

  if (json.errors?.length) {
    throw new ShopifyError(
      json.errors.map((e) => e.message).join("; "),
      query,
      json.errors,
    );
  }

  if (!json.data) {
    throw new ShopifyError("Shopify returned no data", query);
  }

  return json.data;
}
