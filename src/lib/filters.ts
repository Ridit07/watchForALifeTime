import type { Metafield } from "./shopify/types";
import { findMetafield, resolveMetafield } from "./utils";

/**
 * Catalogue filters, expressed as URL search params so a filtered view can
 * be linked, shared and cached. Everything is turned into a Shopify search
 * query string rather than filtered in JS — with hundreds of pieces, the
 * work belongs on their side of the wire.
 */

export type SortOption = {
  value: string;
  label: string;
  sortKey: string;
  reverse: boolean;
};

export const SORT_OPTIONS: SortOption[] = [
  { value: "featured", label: "Featured", sortKey: "BEST_SELLING", reverse: false },
  { value: "newest", label: "Newest", sortKey: "CREATED", reverse: true },
  { value: "price-asc", label: "Price: low to high", sortKey: "PRICE", reverse: false },
  { value: "price-desc", label: "Price: high to low", sortKey: "PRICE", reverse: true },
  { value: "title", label: "A – Z", sortKey: "TITLE", reverse: false },
];

export const PAGE_SIZE = 24;
/** Shopify refuses more than 250 in one page. */
export const MAX_PRODUCTS = 250;

export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Facets that live in Shopify metafields. These cannot go into the search
 * query — Storefront ignores `metafields.*` terms entirely — so they are
 * applied to the fetched page instead.
 */
export const FACETS = [
  { param: "gender", key: "target-gender", label: "Wearer" },
  { param: "display", key: "watch-display", label: "Display" },
] as const;

export type FacetParam = (typeof FACETS)[number]["param"];

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

export type ParsedFilters = {
  brands: string[];
  /** Selected values per facet param, lower-cased for comparison. */
  facets: Record<string, string[]>;
  min?: number;
  max?: number;
  inStock: boolean;
  sort: SortOption;
  first: number;
  /** True when anything narrows the catalogue, used to offer a reset. */
  active: boolean;
};

export function parseFilters(params: SearchParams): ParsedFilters {
  const rawBrand = params.brand;
  const brands = (Array.isArray(rawBrand) ? rawBrand : rawBrand ? [rawBrand] : [])
    .flatMap((b) => b.split(","))
    .map((b) => b.trim())
    .filter(Boolean);

  const num = (v: string | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const list = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v : v ? [v] : [])
      .flatMap((x) => x.split(","))
      .map((x) => x.trim())
      .filter(Boolean);

  const facets: Record<string, string[]> = {};
  for (const f of FACETS) {
    const values = list(params[f.param]);
    if (values.length) facets[f.param] = values;
  }

  const min = num(one(params.min));
  const max = num(one(params.max));
  const inStock = one(params.stock) === "in";

  const sort =
    SORT_OPTIONS.find((o) => o.value === one(params.sort)) ?? SORT_OPTIONS[0];

  const show = Number(one(params.show));
  const first = Math.min(
    MAX_PRODUCTS,
    Number.isFinite(show) && show > 0 ? show : PAGE_SIZE,
  );

  return {
    brands,
    facets,
    min,
    max,
    inStock,
    sort,
    first,
    active:
      brands.length > 0 ||
      Object.keys(facets).length > 0 ||
      min !== undefined ||
      max !== undefined ||
      inStock,
  };
}

/**
 * Builds Shopify's product search syntax. Brands are OR-ed together so
 * ticking two shows both; everything else narrows.
 */
export function toShopifyQuery(
  f: ParsedFilters,
  extra?: string,
): string | undefined {
  const parts: string[] = [];

  if (extra) parts.push(`(${extra})`);

  if (f.brands.length) {
    const ors = f.brands.map((b) => `vendor:"${b.replace(/"/g, '\\"')}"`);
    parts.push(`(${ors.join(" OR ")})`);
  }

  if (f.min !== undefined) parts.push(`variants.price:>=${f.min}`);
  if (f.max !== undefined) parts.push(`variants.price:<=${f.max}`);
  if (f.inStock) parts.push("available_for_sale:true");

  return parts.length ? parts.join(" AND ") : undefined;
}

/** True when a product carries every selected facet value. */
export function matchesFacets(
  product: { metafields: Metafield[] },
  facets: Record<string, string[]>,
): boolean {
  for (const facet of FACETS) {
    const wanted = facets[facet.param];
    if (!wanted?.length) continue;

    const value = resolveMetafield(
      findMetafield(product.metafields, "shopify", facet.key),
    );
    if (!value) return false;

    const have = value.split(",").map((v) => v.trim().toLowerCase());
    if (!wanted.some((w) => have.includes(w.toLowerCase()))) return false;
  }
  return true;
}

/** The facet values actually present in a set of products, for the UI. */
export function facetOptions(
  products: { metafields: Metafield[] }[],
): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};

  for (const facet of FACETS) {
    const set = new Set<string>();
    for (const p of products) {
      const value = resolveMetafield(
        findMetafield(p.metafields, "shopify", facet.key),
      );
      for (const v of value?.split(",") ?? []) {
        const t = v.trim();
        if (t) set.add(t);
      }
    }
    out[facet.param] = set;
  }

  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, [...v].sort()]),
  );
}
