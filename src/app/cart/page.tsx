import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { connection } from "next/server";
import { readCustomerId } from "@/lib/auth";
import { readCart } from "@/lib/cart";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: false },
};

function EmptyBag() {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-2xl font-light text-sand-50">
        Your bag is empty
      </p>
      <p className="mt-3 text-sm text-muted-light">
        Nothing chosen yet — the collection is a good place to start.
      </p>
      <Link href="/collections/all" className="btn btn-primary mt-8">
        Explore the collection
      </Link>
    </div>
  );
}

async function CartContents() {
  await connection();

  const [cart, customerId] = await Promise.all([readCart(), readCustomerId()]);
  const signedIn = Boolean(customerId);

  if (!cart || !cart.lines.length) return <EmptyBag />;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <section aria-label="Bag contents">
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {cart.lines.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="bg-ink p-7">
          <h2 className="font-display text-xl text-sand-50">Order summary</h2>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-light">Subtotal</dt>
              <dd className="text-sand-50">
                {formatMoney(cart.cost.subtotalAmount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-light">Shipping</dt>
              <dd className="text-sand-50">Free</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-base">
              <dt className="text-sand-50">Total</dt>
              <dd className="font-medium text-sand-50">
                {formatMoney(cart.cost.totalAmount)}
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-xs text-muted-light">
            Taxes and any duties are calculated at checkout.
          </p>

          {/* Routed through /cart/checkout so a signed-out visitor is sent
              to sign in first and returned straight to checkout. */}
          <a href="/cart/checkout" className="btn btn-primary mt-7 w-full">
            Proceed to checkout
          </a>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-light">
            {signedIn
              ? "Checkout is completed securely on Shopify."
              : "You'll sign in first — we email you a one-time code."}
          </p>

          <Link
            href="/collections/all"
            className="mt-5 block text-center text-xs tracking-wider text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
          >
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="mb-10 font-display text-3xl font-light text-sand-50 sm:text-4xl">
        Your bag
      </h1>
      <Suspense
        fallback={
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-charcoal" />
            <div className="h-32 bg-charcoal" />
          </div>
        }
      >
        <CartContents />
      </Suspense>
    </div>
  );
}
