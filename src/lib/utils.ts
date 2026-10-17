import type { Metafield, Money } from "./shopify/types";

/**
 * Indian price formatting — lakh/crore grouping, no decimals on whole rupees.
 * ₹14,495 rather than ₹14,495.00, and ₹1,20,000 rather than ₹120,000.
 */
export function formatMoney(money: Money | null | undefined): string {
  if (!money) return "";
  const amount = Number(money.amount);
  if (!Number.isFinite(amount)) return "";

  return new Intl.NumberFormat(
    money.currencyCode === "INR" ? "en-IN" : "en-US",
    {
      style: "currency",
      currency: money.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    },
  ).format(amount);
}

/** Vendor/tag values arrive lowercase from Shopify ("titan"). */
export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function discountPercent(
  price: Money,
  compareAt: Money | null | undefined,
): number | null {
  if (!compareAt) return null;
  const now = Number(price.amount);
  const was = Number(compareAt.amount);
  if (!(was > now) || !now) return null;
  return Math.round(((was - now) / was) * 100);
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Shopify CDN images accept resizing params, which keeps us from shipping
 * 2000px originals into a 400px grid slot.
 */
export function shopifyImage(url: string, width: number): string {
  try {
    const u = new URL(url);
    u.searchParams.set("width", String(width));
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Turns a metafield into something displayable.
 *
 * Shopify's taxonomy fields are metaobject references whose human-readable
 * text sits on the metaobject's `label` field; list types arrive as a
 * JSON-encoded array. Both collapse to a comma-separated string.
 */
export function resolveMetafield(m: Metafield): string | null {
  if (!m) return null;

  const refs = m.references?.edges ?? [];
  if (refs.length) {
    const labels = refs
      .map((e) => e.node.fields.find((f) => f.key === "label")?.value)
      .filter((v): v is string => Boolean(v));
    return labels.length ? labels.join(", ") : null;
  }

  if (m.type.startsWith("list.")) {
    try {
      const parsed: unknown = JSON.parse(m.value);
      if (Array.isArray(parsed)) {
        const items = parsed.filter(Boolean).map(String);
        return items.length ? items.join(", ") : null;
      }
    } catch {
      /* not JSON after all — fall through to the raw value */
    }
  }

  return m.value?.trim() || null;
}

export function findMetafield(
  metafields: Metafield[] | undefined,
  namespace: string,
  key: string,
): Metafield {
  return (
    metafields?.find((m) => m?.namespace === namespace && m?.key === key) ?? null
  );
}
