import { NextResponse, type NextRequest } from "next/server";
import { readCustomer } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

/**
 * Streams the invoice as a real download rather than opening the print
 * dialog. Scoped to the signed-in customer's own orders, so an invoice
 * cannot be fetched by guessing someone else's order number.
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

  const order = customer.orders.find((o) => String(o.orderNumber) === number);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdf = await renderInvoicePdf(order);
  const filename = `invoice-${order.name?.replace(/[^\w-]/g, "") || order.orderNumber}.pdf`;

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
