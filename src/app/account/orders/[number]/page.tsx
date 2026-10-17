import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/account/print-button";
import { readCustomer } from "@/lib/auth";
import type { CustomerAddress, CustomerOrder } from "@/lib/shopify/customer";
import { site } from "@/lib/site";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Invoice",
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
        <p className="mt-2 text-sm text-muted">{fallback || "—"}</p>
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
      <address className="mt-2 text-sm leading-relaxed text-ink not-italic">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}

function Invoice({ order }: { order: CustomerOrder }) {
  /* Shopify gives the tax total but Indian pricing is tax-inclusive, so the
     tax is shown as "included in the above" rather than added to the sum. */
  const tax = order.totalTax;
  const taxIncluded = Number(tax?.amount ?? 0) > 0;

  return (
    <article className="mx-auto max-w-3xl bg-sand-50 p-8 sm:p-12 print:max-w-none print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-sand-300 pb-8">
        <div>
          <p className="font-display text-2xl leading-tight font-light text-ink">
            {site.name}
          </p>
          <p className="mt-1 text-xs text-muted">{site.url}</p>
        </div>
        <div className="text-right">
          <p className="eyebrow">Invoice</p>
          <p className="mt-2 font-display text-xl text-ink">
            {order.name || `#${order.orderNumber}`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {formatDate(order.processedAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-8 border-b border-sand-300 py-8 sm:grid-cols-2">
        <Address
          title="Billed to"
          address={order.billingAddress}
          fallback={order.email}
        />
        <Address title="Shipped to" address={order.shippingAddress} />
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-sand-300 text-left">
            <th className="pb-3 font-normal text-muted">Item</th>
            <th className="pb-3 text-center font-normal text-muted">Qty</th>
            <th className="pb-3 text-right font-normal text-muted">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.lineItems.map((item, i) => (
            <tr key={i} className="border-b border-sand-200 align-top">
              <td className="py-4 pr-4 text-ink">
                {item.title}
                {item.variant?.title &&
                  item.variant.title !== "Default Title" && (
                    <span className="block text-xs text-muted">
                      {item.variant.title}
                    </span>
                  )}
                {item.variant?.sku && (
                  <span className="block text-xs text-muted">
                    SKU {item.variant.sku}
                  </span>
                )}
              </td>
              <td className="py-4 text-center text-ink">{item.quantity}</td>
              <td className="py-4 text-right text-ink">
                {formatMoney(item.discountedTotalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
        {order.subtotalPrice && (
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-ink">{formatMoney(order.subtotalPrice)}</dd>
          </div>
        )}
        {order.totalShippingPrice && (
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd className="text-ink">
              {Number(order.totalShippingPrice.amount) === 0
                ? "Free"
                : formatMoney(order.totalShippingPrice)}
            </dd>
          </div>
        )}
        <div className="flex justify-between border-t border-sand-300 pt-3">
          <dt className="font-medium text-ink">Total</dt>
          <dd className="text-lg font-medium text-ink">
            {formatMoney(order.currentTotalPrice)}
          </dd>
        </div>
        {taxIncluded && tax && (
          <div className="flex justify-between">
            <dt className="text-xs text-muted">Includes tax</dt>
            <dd className="text-xs text-muted">{formatMoney(tax)}</dd>
          </div>
        )}
      </dl>

      <footer className="mt-10 border-t border-sand-300 pt-6 text-xs leading-relaxed text-muted">
        <p>
          Payment status:{" "}
          <span className="text-ink">
            {order.financialStatus?.toLowerCase().replace(/_/g, " ") ?? "—"}
          </span>
        </p>
        <p className="mt-2">
          Thank you for shopping with {site.name}. For any query about this
          order, reply to your confirmation email quoting{" "}
          {order.name || `#${order.orderNumber}`}.
        </p>
      </footer>
    </article>
  );
}

async function InvoicePage({
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
     cannot read another's invoice by guessing a number. */
  const order = customer.orders.find(
    (o) => String(o.orderNumber) === number,
  );

  if (!order) notFound();

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 pt-10 print:hidden sm:px-0">
        <Link
          href="/account"
          className="text-xs tracking-[0.15em] text-muted uppercase underline underline-offset-4 hover:text-ink"
        >
          Back to account
        </Link>
        <div className="flex items-center gap-5">
          <PrintButton />
          <a href={`/account/orders/${number}/invoice.pdf`} className="btn">
            Download PDF
          </a>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-0 print:p-0">
        <Invoice order={order} />
      </div>
    </>
  );
}

export default function OrderInvoicePage({
  params,
}: PageProps<"/account/orders/[number]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto my-10 h-96 max-w-3xl animate-pulse bg-sand-200" />
      }
    >
      <InvoicePage params={params} />
    </Suspense>
  );
}
