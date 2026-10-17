export type Money = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  image: ShopifyImage | null;
};

export type ProductOption = {
  id: string;
  name: string;
  optionValues: { name: string }[];
};

export type MetaobjectRef = {
  fields: { key: string; value: string }[];
};

export type Metafield = {
  key: string;
  namespace: string;
  value: string;
  type: string;
  /** Populated for metaobject_reference types (Shopify's taxonomy fields). */
  references: Connection<MetaobjectRef> | null;
} | null;

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  totalInventory: number | null;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  featuredImage: ShopifyImage | null;
  images: ShopifyImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  metafields: Metafield[];
  seo: { title: string | null; description: string | null };
  updatedAt: string;
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image: ShopifyImage | null;
  seo: { title: string | null; description: string | null };
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money; amountPerQuantity: Money };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    /** Null when the variant is untracked, i.e. no ceiling. */
    quantityAvailable: number | null;
    selectedOptions: SelectedOption[];
    image: ShopifyImage | null;
    product: { handle: string; title: string; vendor: string };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
  lines: CartLine[];
};

export type ShopPolicy = {
  title: string;
  handle: string;
  body: string;
} | null;

export type Page = {
  id: string;
  handle: string;
  title: string;
  body: string;
  bodySummary: string;
  seo: { title: string | null; description: string | null };
};

/** Shape of a Storefront API `edges/node` connection before flattening. */
export type Connection<T> = { edges: { node: T }[] };

export const flatten = <T,>(c: Connection<T> | null | undefined): T[] =>
  c?.edges?.map((e) => e.node) ?? [];
