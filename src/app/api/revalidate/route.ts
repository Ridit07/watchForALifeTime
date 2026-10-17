import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";

/**
 * Shopify webhook receiver. Register these topics in the Shopify admin
 * pointing at /api/revalidate:
 *   products/create, products/update, products/delete
 *   collections/create, collections/update, collections/delete
 *
 * Shopify signs every webhook with the app's secret. We verify that signature
 * rather than a shared query token so a leaked URL is not enough to force
 * cache churn.
 */
const SECRET = process.env.SHOPIFY_REVALIDATION_SECRET;

const TOPIC_TAGS: Record<string, string[]> = {
  products: ["products"],
  collections: ["collections", "products"],
  pages: ["pages"],
  shop: ["shop"],
};

function verify(body: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false;

  const digest = crypto
    .createHmac("sha256", SECRET)
    .update(body, "utf8")
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(signature);

  // timingSafeEqual throws on length mismatch, so guard before comparing.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!SECRET) {
    return NextResponse.json(
      { error: "Revalidation is not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-shopify-hmac-sha256");

  if (!verify(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  const resource = topic.split("/")[0];
  const tags = TOPIC_TAGS[resource];

  if (!tags) {
    // Acknowledge unknown topics — a non-2xx makes Shopify retry forever.
    return NextResponse.json({ revalidated: false, topic });
  }

  // "max" expires every cacheLife profile, so a product edit clears the
  // hours-lived catalog entries as well as the days-lived shop content.
  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tags, topic });
}
