import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getCollections, getPolicies } from "@/lib/shopify";
import { shippingLine, site } from "@/lib/site";
import { titleCase } from "@/lib/utils";

/* Shopify returns null for a policy that has not been written yet, so the
   footer only links the ones that actually exist — an unwritten policy would
   otherwise be a 404 in the footer of every page. */
const POLICY_ROUTES = [
  { key: "privacyPolicy", href: "/policies/privacy-policy" },
  { key: "refundPolicy", href: "/policies/refund-policy" },
  { key: "shippingPolicy", href: "/policies/shipping-policy" },
  { key: "termsOfService", href: "/policies/terms-of-service" },
] as const;

/**
 * Prerendering cannot read the clock, so the year is cached and refreshed
 * daily rather than computed per request.
 */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

/**
 * Shop and Support columns stream in. They read Shopify, and with
 * `DISABLE_CACHE=1` that read is uncached — which cannot be prerendered
 * unless it sits behind a boundary like this one.
 */
async function FooterLinks() {
  const [collections, policies] = await Promise.all([
    getCollections(),
    getPolicies(),
  ]);

  // flatMap keeps the literal href types that typed routes rely on.
  const policyLinks = POLICY_ROUTES.flatMap((r) => {
    const label = policies[r.key]?.title;
    return label ? [{ href: r.href, label }] : [];
  });

  return (
    <>
      <div>
            <h2 className="text-[11px] font-medium tracking-[0.2em] text-brass-light uppercase">
              Shop
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/collections/all" className="footer-link">
                  All Watches
                </Link>
              </li>
              <li>
                <a
                  href={site.payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Pay Here
                </a>
              </li>
              {collections.map((c) => (
                <li key={c.handle}>
                  <Link
                    href={`/collections/${c.handle}`}
                    className="footer-link"
                  >
                    {titleCase(c.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-medium tracking-[0.2em] text-brass-light uppercase">
              Support
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/about" className="footer-link">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/pages/contact" className="footer-link">
                  Contact
                </Link>
              </li>
              {policyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="footer-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-sand-200 print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-2xl text-sand-50">{site.name}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-light">
              {site.heritage}
            </p>
            <p className="mt-5 text-xs leading-relaxed text-brass-light">
              {shippingLine}
            </p>
          </div>

          <Suspense
            fallback={
              <>
                <div className="h-40 animate-pulse bg-white/5" />
                <div className="h-40 animate-pulse bg-white/5" />
              </>
            }
          >
            <FooterLinks />
          </Suspense>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-muted-light sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {site.name}. All rights reserved.
          </p>
          <p>Gurugram, Haryana · India</p>
        </div>
      </div>
    </footer>
  );
}
