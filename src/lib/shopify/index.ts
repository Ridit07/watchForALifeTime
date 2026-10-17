import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { shopifyFetch } from "./client";
import {
  CART_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_DETAIL_FRAGMENT,
} from "./fragments";
import {
  flatten,
  type Cart,
  type Collection,
  type Connection,
  type Page,
  type Product,
  type ShopPolicy,
} from "./types";

/* ------------------------------------------------------------------ *
 * Catalog reads — cached, revalidated by tag from the Shopify webhook
 * ------------------------------------------------------------------ */

type RawProduct = Omit<Product, "images" | "variants"> & {
  images: Connection<Product["images"][number]>;
  variants: Connection<Product["variants"][number]>;
};

const hydrate = (p: RawProduct): Product => ({
  ...p,
  images: flatten(p.images),
  variants: flatten(p.variants),
});

export async function getProducts({
  first = 24,
  sortKey = "BEST_SELLING",
  reverse = false,
  query,
}: {
  first?: number;
  sortKey?: string;
  reverse?: boolean;
  query?: string;
} = {}): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const data = await shopifyFetch<{ products: Connection<RawProduct> }>({
    query: /* GraphQL */ `
      query Products(
        $first: Int!
        $sortKey: ProductSortKeys
        $reverse: Boolean
        $query: String
      ) {
        products(
          first: $first
          sortKey: $sortKey
          reverse: $reverse
          query: $query
        ) {
          edges { node { ...ProductCardFields } }
        }
      }
      ${PRODUCT_CARD_FRAGMENT}
    `,
    variables: { first, sortKey, reverse, query },
  });

  return flatten(data.products).map(hydrate);
}

/**
 * Distinct vendors across the catalogue, for the brand filter. Shopify has
 * no "list all vendors" query on the Storefront API, so this reads handles
 * cheaply and reduces. Cached alongside the catalogue.
 */
export async function getVendors(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const data = await shopifyFetch<{
    products: Connection<{ vendor: string }>;
  }>({
    query: /* GraphQL */ `
      query Vendors {
        products(first: 250) {
          edges { node { vendor } }
        }
      }
    `,
  });

  const seen = new Set(
    flatten(data.products)
      .map((p) => p.vendor)
      .filter(Boolean),
  );

  return [...seen].sort((a, b) => a.localeCompare(b));
}

export async function getProduct(handle: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${handle}`);

  const data = await shopifyFetch<{ product: RawProduct | null }>({
    query: /* GraphQL */ `
      query Product($handle: String!) {
        product(handle: $handle) { ...ProductDetailFields }
      }
      ${PRODUCT_DETAIL_FRAGMENT}
    `,
    variables: { handle },
  });

  return data.product ? hydrate(data.product) : null;
}

export async function getProductHandles(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const data = await shopifyFetch<{
    products: Connection<{ handle: string }>;
  }>({
    query: /* GraphQL */ `
      query Handles { products(first: 250) { edges { node { handle } } } }
    `,
  });

  return flatten(data.products).map((p) => p.handle);
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("collections");

  const data = await shopifyFetch<{ collections: Connection<Collection> }>({
    query: /* GraphQL */ `
      query Collections {
        collections(first: 50, sortKey: TITLE) {
          edges {
            node {
              id
              handle
              title
              description
              descriptionHtml
              image { url altText width height }
              seo { title description }
            }
          }
        }
      }
    `,
  });

  // `frontpage` is Shopify's automatic home-page collection, never a real one.
  return flatten(data.collections).filter((c) => c.handle !== "frontpage");
}

export async function getCollection(handle: string): Promise<
  (Collection & { products: Product[] }) | null
> {
  "use cache";
  cacheLife("hours");
  cacheTag("collections", "products", `collection:${handle}`);

  const data = await shopifyFetch<{
    collection:
      | (Collection & { products: Connection<RawProduct> })
      | null;
  }>({
    query: /* GraphQL */ `
      query Collection($handle: String!) {
        collection(handle: $handle) {
          id
          handle
          title
          description
          descriptionHtml
          image { url altText width height }
          seo { title description }
          products(first: 100) { edges { node { ...ProductCardFields } } }
        }
      }
      ${PRODUCT_CARD_FRAGMENT}
    `,
    variables: { handle },
  });

  if (!data.collection) return null;

  return {
    ...data.collection,
    products: flatten(data.collection.products).map(hydrate),
  };
}

/* ------------------------------------------------------------------ *
 * Shop content
 * ------------------------------------------------------------------ */

export type ShopInfo = {
  name: string;
  description: string | null;
  primaryDomain: { url: string };
  paymentSettings: { currencyCode: string; countryCode: string };
};

export async function getShop(): Promise<ShopInfo> {
  "use cache";
  cacheLife("days");
  cacheTag("shop");

  const data = await shopifyFetch<{ shop: ShopInfo }>({
    query: /* GraphQL */ `
      query Shop {
        shop {
          name
          description
          primaryDomain { url }
          paymentSettings { currencyCode countryCode }
        }
      }
    `,
  });

  return data.shop;
}

export async function getPolicies(): Promise<Record<string, ShopPolicy>> {
  "use cache";
  cacheLife("days");
  cacheTag("shop");

  const data = await shopifyFetch<{
    shop: Record<string, ShopPolicy>;
  }>({
    query: /* GraphQL */ `
      query Policies {
        shop {
          privacyPolicy { title handle body }
          refundPolicy { title handle body }
          termsOfService { title handle body }
          shippingPolicy { title handle body }
        }
      }
    `,
  });

  return data.shop;
}

export async function getPageHandles(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag("pages");

  const data = await shopifyFetch<{ pages: Connection<{ handle: string }> }>({
    query: /* GraphQL */ `
      query PageHandles { pages(first: 50) { edges { node { handle } } } }
    `,
  });

  return flatten(data.pages).map((p) => p.handle);
}

export async function getPage(handle: string): Promise<Page | null> {
  "use cache";
  cacheLife("days");
  cacheTag("pages");

  const data = await shopifyFetch<{ page: Page | null }>({
    query: /* GraphQL */ `
      query Page($handle: String!) {
        page(handle: $handle) {
          id
          handle
          title
          body
          bodySummary
          seo { title description }
        }
      }
    `,
    variables: { handle },
  });

  return data.page;
}

/* ------------------------------------------------------------------ *
 * Cart — never cached, always a live read/write
 * ------------------------------------------------------------------ */

type RawCart = Omit<Cart, "lines"> & { lines: Connection<Cart["lines"][number]> };

const hydrateCart = (c: RawCart | null): Cart | null =>
  c ? { ...c, lines: flatten(c.lines) } : null;

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: RawCart | null }>({
    query: /* GraphQL */ `
      query Cart($cartId: ID!) {
        cart(id: $cartId) { ...CartFields }
      }
      ${CART_FRAGMENT}
    `,
    variables: { cartId },
    noStore: true,
  });

  return hydrateCart(data.cart);
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[] = [],
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartCreate: { cart: RawCart; userErrors: { message: string }[] };
  }>({
    query: /* GraphQL */ `
      mutation CartCreate($lines: [CartLineInput!]) {
        cartCreate(input: { lines: $lines }) {
          cart { ...CartFields }
          userErrors { message }
        }
      }
      ${CART_FRAGMENT}
    `,
    variables: { lines },
    noStore: true,
  });

  assertNoUserErrors(data.cartCreate.userErrors);
  return hydrateCart(data.cartCreate.cart) as Cart;
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart | null> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: RawCart | null; userErrors: { message: string }[] };
  }>({
    query: /* GraphQL */ `
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { message }
        }
      }
      ${CART_FRAGMENT}
    `,
    variables: { cartId, lines },
    noStore: true,
  });

  assertNoUserErrors(data.cartLinesAdd.userErrors);
  return hydrateCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart | null> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: RawCart | null;
      userErrors: { message: string }[];
    };
  }>({
    query: /* GraphQL */ `
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { message }
        }
      }
      ${CART_FRAGMENT}
    `,
    variables: { cartId, lines: [{ id: lineId, quantity }] },
    noStore: true,
  });

  assertNoUserErrors(data.cartLinesUpdate.userErrors);
  return hydrateCart(data.cartLinesUpdate.cart);
}

export async function removeCartLine(
  cartId: string,
  lineId: string,
): Promise<Cart | null> {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: RawCart | null;
      userErrors: { message: string }[];
    };
  }>({
    query: /* GraphQL */ `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
          userErrors { message }
        }
      }
      ${CART_FRAGMENT}
    `,
    variables: { cartId, lineIds: [lineId] },
    noStore: true,
  });

  assertNoUserErrors(data.cartLinesRemove.userErrors);
  return hydrateCart(data.cartLinesRemove.cart);
}

/**
 * Live stock for one variant. Read fresh on every add-to-bag: the cached
 * product page may be an hour old, and the last piece can go in that time.
 */
export async function getVariantAvailability(variantId: string): Promise<{
  availableForSale: boolean;
  quantityAvailable: number | null;
} | null> {
  const data = await shopifyFetch<{
    node: {
      availableForSale: boolean;
      quantityAvailable: number | null;
    } | null;
  }>({
    query: /* GraphQL */ `
      query VariantAvailability($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            availableForSale
            quantityAvailable
          }
        }
      }
    `,
    variables: { id: variantId },
    noStore: true,
  });

  return data.node ?? null;
}

function assertNoUserErrors(errors: { message: string }[] | undefined) {
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
}

export * from "./types";
