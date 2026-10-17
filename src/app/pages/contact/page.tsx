import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { getPage } from "@/lib/shopify";
import { shippingLine, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Visit the showroom in Gurugram, or send us a message about a watch, a service or an exchange.",
  alternates: { canonical: "/pages/contact" },
};

/** The showroom's own words, edited in Shopify rather than hard-coded here. */
async function ShopifyIntro() {
  const page = await getPage("contact");
  if (!page?.body) return null;

  return (
    <div
      className="rte text-[15px] leading-relaxed text-muted-light"
      dangerouslySetInnerHTML={{ __html: page.body }}
    />
  );
}

export default function ContactPage() {
  return (
    <>
      <header className="bg-ink py-16 text-center text-sand-100">
        <div className="mx-auto max-w-2xl px-4">
          <p className="eyebrow text-brass-light">Say hello</p>
          <h1 className="mt-3 font-display text-4xl font-light text-sand-50 sm:text-5xl">
            Contact
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-light">
            Questions about a piece, a service, or an exchange — we answer
            every message.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_320px] lg:gap-20">
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="eyebrow mb-6">
            Send a message
          </h2>
          <ContactForm formId={site.formspreeId} />
        </section>

        <aside className="space-y-9 text-sm">
          <div>
            <h2 className="eyebrow mb-3">The showroom</h2>
            <Suspense
              fallback={<div className="h-20 animate-pulse bg-charcoal" />}
            >
              <ShopifyIntro />
            </Suspense>
          </div>

          {site.contactEmail && (
            <div>
              <h2 className="eyebrow mb-3">Email</h2>
              <a
                href={`mailto:${site.contactEmail}`}
                className="text-sand-50 underline underline-offset-4 hover:text-brass-dark"
              >
                {site.contactEmail}
              </a>
            </div>
          )}

          <div>
            <h2 className="eyebrow mb-3">Delivery &amp; exchange</h2>
            <p className="leading-relaxed text-muted-light">{shippingLine}.</p>
            <p className="mt-2 leading-relaxed text-muted-light">
              Exchanges are handled in person at the showroom, with the
              original tags intact and the watch unworn. We do not offer
              refunds.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
