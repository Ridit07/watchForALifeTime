import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButton } from "@/components/account/logout-button";
import { readCustomer } from "@/lib/auth";
import type { CustomerOrder } from "@/lib/shopify/customer";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

function statusLabel(order: CustomerOrder): string {
  const map: Record<string, string> = {
    FULFILLED: "Delivered",
    UNFULFILLED: "Preparing",
    PARTIALLY_FULFILLED: "Partly shipped",
    IN_PROGRESS: "On its way",
    SCHEDULED: "Scheduled",
    ON_HOLD: "On hold",
    RESTOCKED: "Returned",
  };
  return map[order.fulfillmentStatus] ?? "Processing";
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const date = new Date(order.processedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li className="bg-ink p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg text-sand-50">
            Order #{order.orderNumber}
          </p>
          <p className="mt-1 text-xs text-muted-light">{date}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-sand-50">
            {formatMoney(order.currentTotalPrice)}
          </p>
          <p className="mt-1 text-[11px] tracking-[0.15em] text-brass-dark uppercase">
            {statusLabel(order)}
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-3">
        {order.lineItems.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            {item.variant?.image && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-tile">
                <Image
                  src={item.variant.image.url}
                  alt={item.variant.image.altText || item.title}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
            )}
            <span className="text-xs text-muted-light">
              {item.title}
              {item.quantity > 1 && ` × ${item.quantity}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-5">
        <a
          href={order.statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
        >
          Track this order
        </a>
        <Link
          href={`/account/orders/${order.orderNumber}`}
          className="text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
        >
          View invoice
        </Link>
      </div>
    </li>
  );
}

async function AccountContents() {
  const customer = await readCustomer();

  // Expired or missing session — send them to sign in, then back here.
  if (!customer) redirect("/account/authorize?next=/account");

  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");
  const address = customer.defaultAddress;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 font-display text-3xl font-light text-sand-50 sm:text-4xl">
            {name || "Welcome back"}
          </h1>
          {customer.email && (
            <p className="mt-2 text-sm text-muted-light">{customer.email}</p>
          )}
        </div>
        <LogoutButton />
      </div>

      <div aria-hidden className="rule my-10" />

      <div className="grid gap-12 lg:grid-cols-[1fr_300px] lg:gap-16">
        <section>
          <h2 className="eyebrow mb-5">Order history</h2>
          {customer.orders.length ? (
            <ul className="space-y-4">
              {customer.orders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </ul>
          ) : (
            <div className="bg-ink p-10 text-center">
              <p className="text-sm text-muted-light">
                You have not placed an order yet.
              </p>
              <Link href="/collections/all" className="btn btn-primary mt-6">
                Explore the collection
              </Link>
            </div>
          )}
        </section>

        <aside>
          <h2 className="eyebrow mb-5">Default address</h2>
          {address ? (
            <address className="bg-ink p-6 text-sm leading-relaxed text-muted-light not-italic">
              {[address.firstName, address.lastName].filter(Boolean).join(" ") && (
                <span className="block text-sand-50">
                  {[address.firstName, address.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              )}
              {address.address1 && <span className="block">{address.address1}</span>}
              {address.address2 && <span className="block">{address.address2}</span>}
              <span className="block">
                {[address.city, address.province, address.zip]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              {address.country && <span className="block">{address.country}</span>}
              {address.phone && (
                <span className="mt-2 block">{address.phone}</span>
              )}
            </address>
          ) : (
            <p className="bg-ink p-6 text-sm text-muted-light">
              No address saved yet. You can add one during checkout.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Suspense
        fallback={
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-56 bg-charcoal" />
            <div className="h-32 bg-charcoal" />
            <div className="h-32 bg-charcoal" />
          </div>
        }
      >
        <AccountContents />
      </Suspense>
    </div>
  );
}
