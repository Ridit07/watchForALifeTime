import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        eyebrow="Say hello"
        title="Contact"
        intro="Questions about a piece, a service, or an exchange — we answer every message."
      />

      <div className="shell section grid gap-16 lg:grid-cols-[1fr_320px] lg:gap-24">
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="eyebrow mb-8">
            Send a message
          </h2>
          <ContactForm formId={site.formspreeId} />
        </section>

        <aside className="space-y-12 text-sm">
          <div>
            <h2 className="eyebrow mb-4">The showroom</h2>
            <Suspense
              fallback={<div className="h-20 animate-pulse bg-charcoal" />}
            >
              <ShopifyIntro />
            </Suspense>
          </div>

          {site.contactEmail && (
            <div>
              <h2 className="eyebrow mb-4">Email</h2>
              <a
                href={`mailto:${site.contactEmail}`}
                className="text-sand-50 underline underline-offset-4 hover:text-brass-light"
              >
                {site.contactEmail}
              </a>
            </div>
          )}

          <div>
            <h2 className="eyebrow mb-4">Delivery &amp; exchange</h2>
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
