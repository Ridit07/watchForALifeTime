import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/account/print-button";
import { readCustomer } from "@/lib/auth";
import type { CustomerAddress, CustomerOrder } from "@/lib/shopify/customer";
import { getUploadedInvoice } from "@/lib/shopify/order-invoice";
import { site } from "@/lib/site";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Address({
  title,
  address,
  fallback,
}: {
  title: string;
  address: CustomerAddress | null;
  fallback?: string | null;
}) {
  if (!address) {
    return (
      <div>
        <p className="eyebrow">{title}</p>
        <p className="mt-2 text-sm text-muted-light">{fallback || "—"}</p>
      </div>
    );
  }

  const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
  const lines = [
    name,
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter(Boolean);

  return (
    <div>
      <p className="eyebrow">{title}</p>
      <address className="mt-2 text-sm leading-relaxed text-sand-50 not-italic">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}

/**
 * The invoice is a document the showroom issues and uploads, so until one
 * exists this says so rather than offering a download that 404s. Streamed in
 * its own boundary: it costs an Admin API round trip the summary does not
 * need to wait on.
 */
async function InvoiceLink({ orderNumber }: { orderNumber: string }) {
  const invoice = await getUploadedInvoice(orderNumber);

  if (!invoice) {
    return (
      <p className="text-xs leading-relaxed text-muted">
        Your invoice will appear here once the showroom has issued it.
      </p>
    );
  }

  return (
    <a href={`/account/orders/${orderNumber}/invoice.pdf`} className="btn btn-primary">
      Download invoice
    </a>
  );
}

function OrderSummary({ order }: { order: CustomerOrder }) {
  /* Shopify gives the tax total but Indian pricing is tax-inclusive, so the
     tax is shown as "included in the above" rather than added to the sum. */
  const tax = order.totalTax;
  const taxIncluded = Number(tax?.amount ?? 0) > 0;

  return (
    <article className="mx-auto max-w-3xl border border-sand-50/10 bg-olive p-8 sm:p-12 print:max-w-none print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-sand-50/10 pb-8">
        <div>
          <p className="font-display text-2xl leading-tight font-light text-sand-50">
            {site.name}
          </p>
          <p className="mt-1 text-xs text-muted-light">{site.url}</p>
        </div>
        <div className="text-right">
          <p className="eyebrow">Order</p>
          <p className="mt-2 font-display text-xl text-sand-50">
            {order.name || `#${order.orderNumber}`}
          </p>
          <p className="mt-1 text-xs text-muted-light">
            {formatDate(order.processedAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-8 border-b border-sand-50/10 py-8 sm:grid-cols-2">
        <Address
          title="Billed to"
          address={order.billingAddress}
          fallback={order.email}
        />
        <Address title="Shipped to" address={order.shippingAddress} />
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-sand-50/10 text-left">
            <th className="pb-3 font-normal text-muted-light">Item</th>
            <th className="pb-3 text-center font-normal text-muted-light">Qty</th>
            <th className="pb-3 text-right font-normal text-muted-light">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.lineItems.map((item, i) => (
            <tr key={i} className="border-b border-sand-50/10 align-top">
              <td className="py-4 pr-4 text-sand-50">
                {item.title}
                {item.variant?.title &&
                  item.variant.title !== "Default Title" && (
                    <span className="block text-xs text-muted-light">
                      {item.variant.title}
                    </span>
                  )}
                {item.variant?.sku && (
                  <span className="block text-xs text-muted-light">
                    SKU {item.variant.sku}
                  </span>
                )}
              </td>
              <td className="py-4 text-center text-sand-50">{item.quantity}</td>
              <td className="py-4 text-right text-sand-50">
                {formatMoney(item.discountedTotalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
        {order.subtotalPrice && (
          <div className="flex justify-between">
            <dt className="text-muted-light">Subtotal</dt>
            <dd className="text-sand-50">{formatMoney(order.subtotalPrice)}</dd>
          </div>
        )}
        {order.totalShippingPrice && (
          <div className="flex justify-between">
            <dt className="text-muted-light">Shipping</dt>
            <dd className="text-sand-50">
              {Number(order.totalShippingPrice.amount) === 0
                ? "Free"
                : formatMoney(order.totalShippingPrice)}
            </dd>
          </div>
        )}
        <div className="flex justify-between border-t border-sand-50/10 pt-3">
          <dt className="font-medium text-sand-50">Total</dt>
          <dd className="text-lg font-medium text-sand-50">
            {formatMoney(order.currentTotalPrice)}
          </dd>
        </div>
        {taxIncluded && tax && (
          <div className="flex justify-between">
            <dt className="text-xs text-muted-light">Includes tax</dt>
            <dd className="text-xs text-muted-light">{formatMoney(tax)}</dd>
          </div>
        )}
      </dl>

      <footer className="mt-10 border-t border-sand-50/10 pt-6 text-xs leading-relaxed text-muted-light">
        <p>
          Payment status:{" "}
          <span className="text-sand-50">
            {order.financialStatus?.toLowerCase().replace(/_/g, " ") ?? "—"}
          </span>
        </p>
        <p className="mt-2">
          This is a summary of your order, not a tax invoice. For any query
          about it, reply to your confirmation email quoting{" "}
          {order.name || `#${order.orderNumber}`}.
        </p>
      </footer>
    </article>
  );
}

async function OrderView({
  params,
}: {
  params: PageProps<"/account/orders/[number]">["params"];
}) {
  const { number } = await params;
  const customer = await readCustomer();

  if (!customer) {
    redirect(`/account/authorize?next=/account/orders/${number}`);
  }

  /* Matched against the signed-in customer's own orders, so one customer
     cannot read another's order by guessing a number. */
  const order = customer.orders.find(
    (o) => String(o.orderNumber) === number,
  );

  if (!order) notFound();

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 pt-10 print:hidden sm:px-0">
        <Link
          href="/account"
          className="text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
        >
          Back to account
        </Link>
        <div className="flex items-center gap-6">
          <PrintButton />
          <Suspense
            fallback={<div className="h-12 w-44 animate-pulse bg-charcoal" />}
          >
            <InvoiceLink orderNumber={number} />
          </Suspense>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-0 print:p-0">
        <OrderSummary order={order} />
      </div>
    </>
  );
}

export default function OrderPage({
  params,
}: PageProps<"/account/orders/[number]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto my-10 h-96 max-w-3xl animate-pulse bg-charcoal" />
      }
    >
      <OrderView params={params} />
    </Suspense>
  );
}
