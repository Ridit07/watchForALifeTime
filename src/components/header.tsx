import Link from "next/link";
import { Suspense } from "react";
import { readCart } from "@/lib/cart";
import { connection } from "next/server";
import { readCustomer } from "@/lib/auth";
import { navLinks, site } from "@/lib/site";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchIcon, BagIcon, UserIcon } from "./icons";

async function CartCount() {
  /* The bag is per-visitor and cannot be prerendered. Saying so explicitly
     stops Next trying, which is what surfaces as an unstable-value error
     during the dev prerender pass. */
  await connection();

  const cart = await readCart();
  const count = cart?.totalQuantity ?? 0;
  if (!count) return null;

  return (
    <span
      aria-hidden
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-semibold text-olive"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Signed-in customers go straight to their account, everyone else to sign in. */
async function AccountLink() {
  await connection();

  const customer = await readCustomer();

  /* Signing in leaves the app for Shopify's hosted screen, so it has to be a
     real navigation — a <Link> would try to fetch an RSC payload from a route
     handler and fail before falling back. */
  if (!customer) {
    return (
      <a
        href="/account/authorize"
        aria-label="Sign in"
        className="icon-button relative hidden sm:inline-flex"
      >
        <UserIcon />
      </a>
    );
  }

  return (
    <Link
      href="/account"
      aria-label="Your account"
      className="icon-button relative hidden sm:inline-flex"
    >
      <UserIcon />
      <span
        aria-hidden
        className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brass"
      />
    </Link>
  );
}

/**
 * A fixed four-item bar. Collections are left to the All Watches filters:
 * with hundreds of pieces across a growing set of brands, listing them in
 * the header stops scaling almost immediately.
 */
function Nav() {
  return (
    <nav
      aria-label="Main"
      className="hidden items-center justify-center gap-12 lg:flex"
    >
      {navLinks.map((l) => (
        <Link key={l.href} href={l.href} className="nav-link">
          {l.label}
        </Link>
      ))}
      <a
        href={site.payUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-link text-brass-light hover:text-sand-50"
      >
        Pay Here
      </a>
    </nav>
  );
}

export function Header() {
  return (
    /* A direct child of <body>, not wrapped: a sticky element can only stick
       inside its own parent, so a wrapper here would let the bar scroll away
       the moment that wrapper ended. */
    <header className="sticky top-0 z-50 border-b border-sand-50/10 bg-ink text-sand-100 print:hidden">
      <div className="shell flex items-center gap-6 py-4">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Suspense fallback={null}>
              <MobileNavLoader />
            </Suspense>
          </div>

          <Link href="/" aria-label={`${site.name} — home`}>
            <Logo height={56} priority className="h-11 w-auto sm:h-14" />
          </Link>
        </div>

        <div className="flex flex-1 justify-center">
          <Nav />
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Link href="/search" aria-label="Search" className="icon-button">
            <SearchIcon />
          </Link>
          <Suspense
            fallback={
              <a
                href="/account/authorize"
                aria-label="Account"
                className="icon-button hidden sm:inline-flex"
              >
                <UserIcon />
              </a>
            }
          >
            <AccountLink />
          </Suspense>
          <Link
            href="/cart"
            aria-label="Shopping bag"
            className="icon-button relative"
          >
            <BagIcon />
            <Suspense fallback={null}>
              <CartCount />
            </Suspense>
          </Link>
        </div>
      </div>
    </header>
  );
}

async function MobileNavLoader() {
  await connection();

  const customer = await readCustomer();
  return <MobileNav signedIn={Boolean(customer)} />;
}
