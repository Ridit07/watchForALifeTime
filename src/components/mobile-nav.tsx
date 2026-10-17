"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { navLinks, site } from "@/lib/site";
import { MenuIcon, CloseIcon } from "./icons";

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  /* Close on navigation, otherwise the panel survives the route change.
     Adjusting during render rather than in an effect avoids a second pass,
     and catches back/forward navigation too. */
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="icon-button"
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <div className="animate-rise absolute inset-y-0 left-0 w-[82%] max-w-sm overflow-y-auto bg-ink px-6 py-5 text-sand-100">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-sand-50">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="icon-button"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="mobile-link">
                  {l.label}
                </Link>
              ))}
              <a
                href={site.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-link text-brass-light"
              >
                Pay Here
              </a>
              <Link href="/about" className="mobile-link">
                Our Story
              </Link>
              <Link href="/search" className="mobile-link">
                Search
              </Link>
              {signedIn ? (
                <Link href="/account" className="mobile-link">
                  Your account
                </Link>
              ) : (
                /* Full navigation: this leaves the app for Shopify. */
                <a href="/account/authorize" className="mobile-link">
                  Sign in
                </a>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
