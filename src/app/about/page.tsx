import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story",
  description: site.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="Since the beginning" title="Our story" />

      <article className="shell-prose section">
        <p className="font-display text-[1.75rem] leading-[1.6] font-light text-sand-50">
          {site.heritage}
        </p>

        <div aria-hidden className="rule my-14" />

        <div className="rte text-[15px]">
          <p>
            A watch is rarely bought in a hurry. It is handled, turned over,
            tried against the wrist, and set down again. That unhurried way of
            choosing is what our showroom was built around, and it has not
            changed since Mr. Naresh Chand Jain first opened the counter.
          </p>
          <p>
            We stock watches and clocks across the range — everyday automatics,
            dress pieces for the occasions that deserve one, and wall clocks
            that outlast the rooms they hang in. Every piece is sourced directly
            from the brand and carries its full manufacturer warranty.
          </p>
          <h2>What we still do by hand</h2>
          <p>
            Strap fitting, battery replacement, and servicing are handled
            in-house at the Gurgaon showroom. If you bought it from us, bring it
            back whenever it needs attention.
          </p>
          <h2>Buying online</h2>
          <p>
            Everything on this site is the same stock that sits in the
            showroom. We deliver within Gurugram only, and delivery is free.
            If a piece is not right, bring it back to the showroom within
            seven days with the tags intact and unworn, and we will exchange
            it. We do not offer refunds.
          </p>
        </div>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link href="/collections/all" className="btn btn-primary">
            Explore the collection
          </Link>
          <Link href="/pages/contact" className="btn btn-outline">
            Visit the showroom
          </Link>
        </div>
      </article>
    </>
  );
}
