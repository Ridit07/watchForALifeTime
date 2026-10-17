import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { getOrderForInvoice } from "@/lib/shopify/admin-orders";

/**
 * Staff-facing invoice for any order, rendered from the same generator the
 * customer's copy uses so the two cannot drift apart.
 *
 * Guarded by a shared secret rather than a customer session: there is no
 * staff login in this app, and the Admin API token behind this route can read
 * every order in the shop. Fails closed when the secret is unset, so a
 * missing env var cannot silently expose the catalogue of orders.
 */
const SECRET = process.env.ADMIN_INVOICE_TOKEN;

function authorised(request: NextRequest): boolean {
  if (!SECRET) return false;

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const supplied =
    bearer ?? request.nextUrl.searchParams.get("token") ?? "";

  // timingSafeEqual throws on a length mismatch, so compare digests instead.
  const a = crypto.createHash("sha256").update(supplied).digest();
  const b = crypto.createHash("sha256").update(SECRET).digest();

  return crypto.timingSafeEqual(a, b);
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/admin/orders/[number]/invoice.pdf">,
) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { number } = await params;

  if (!/^\d+$/.test(number)) {
    return NextResponse.json({ error: "Bad order number" }, { status: 400 });
  }

  const order = await getOrderForInvoice(number);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdf = await renderInvoicePdf(order);

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${number}.pdf"`,
      "Cache-Control": "private, no-store",
      // Never let a staff invoice URL end up in a search index.
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
