import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getPolicies } from "@/lib/shopify";

/** Route handle -> the field name the Storefront API uses. */
const POLICY_MAP = {
  "privacy-policy": "privacyPolicy",
  "refund-policy": "refundPolicy",
  "terms-of-service": "termsOfService",
  "shipping-policy": "shippingPolicy",
} as const;

type PolicyHandle = keyof typeof POLICY_MAP;

export function generateStaticParams() {
  return Object.keys(POLICY_MAP).map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/policies/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const key = POLICY_MAP[handle as PolicyHandle];
  if (!key) return { title: "Not found" };

  const policies = await getPolicies();
  const policy = policies[key];

  return {
    title: policy?.title ?? "Policy",
    alternates: { canonical: `/policies/${handle}` },
  };
}

export default async function PolicyPage({
  params,
}: PageProps<"/policies/[handle]">) {
  const { handle } = await params;
  const key = POLICY_MAP[handle as PolicyHandle];
  if (!key) notFound();

  const policies = await getPolicies();
  const policy = policies[key];

  // A policy that has not been written in Shopify admin comes back null.
  if (!policy) notFound();

  return (
    <>
      <PageHeader eyebrow="Policy" title={policy.title} />
      <article className="shell-prose section">
        <div
          className="rte text-[15px]"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      </article>
    </>
  );
}
