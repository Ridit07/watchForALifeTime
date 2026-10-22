import { NextResponse, type NextRequest } from "next/server";
import { readCustomer } from "@/lib/auth";
import { getUploadedInvoice } from "@/lib/shopify/order-invoice";

/**
 * Serves the invoice the showroom uploaded against this order.
 *
 * The bytes are proxied rather than redirected to: a Shopify Files URL is
 * public to anyone holding it, so handing it to the browser would turn a tax
 * document into a shareable link that outlives the session. Going through
 * here keeps the only published address one that checks who is asking.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/account/orders/[number]/invoice.pdf">,
) {
  const { number } = await params;
  const customer = await readCustomer();

  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  /* Matched against the signed-in customer's own orders, so an invoice
     cannot be fetched by guessing someone else's order number. */
  const order = customer.orders.find((o) => String(o.orderNumber) === number);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const invoice = await getUploadedInvoice(number);
  if (!invoice) {
    return NextResponse.json(
      { error: "No invoice has been issued for this order yet" },
      { status: 404 },
    );
  }

  const upstream = await fetch(invoice.url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Invoice could not be retrieved" },
      { status: 502 },
    );
  }

  const filename = `invoice-${order.name?.replace(/[^\w-]/g, "") || order.orderNumber}.pdf`;

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": invoice.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(invoice.size ? { "Content-Length": String(invoice.size) } : {}),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
