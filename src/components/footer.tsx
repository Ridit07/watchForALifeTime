import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getCollections, getPolicies } from "@/lib/shopify";
import { shippingLine, site } from "@/lib/site";
import { titleCase } from "@/lib/utils";
import { Logo } from "./logo";

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
            <h2 className="text-[10px] font-medium tracking-[0.28em] text-brass-light uppercase">
              Shop
            </h2>
            <ul className="mt-7 space-y-4 text-sm">
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
            <h2 className="text-[10px] font-medium tracking-[0.28em] text-brass-light uppercase">
              Support
            </h2>
            <ul className="mt-7 space-y-4 text-sm">
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
    <footer className="border-t border-sand-50/10 bg-ink text-sand-200 print:hidden">
      <div className="shell py-20 md:py-28">
        <div className="grid gap-16 md:grid-cols-4 md:gap-12">
          <div className="md:col-span-2">
            <Logo height={80} className="h-20 w-auto" />
            <p className="mt-9 max-w-sm text-sm leading-[1.9] text-muted-light">
              {site.heritage}
            </p>
            <p className="mt-7 text-xs leading-relaxed text-brass-light">
              {shippingLine}
            </p>
          </div>

          <Suspense
            fallback={
              <>
                <div className="h-40 animate-pulse bg-sand-50/5" />
                <div className="h-40 animate-pulse bg-sand-50/5" />
              </>
            }
          >
            <FooterLinks />
          </Suspense>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-sand-50/10 pt-10 text-[11px] tracking-wider text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {site.name}. All rights reserved.
          </p>
          <p>Gurugram, Haryana · India</p>
        </div>
      </div>
    </footer>
  );
}
