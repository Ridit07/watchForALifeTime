import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getPage, getPageHandles } from "@/lib/shopify";

export async function generateStaticParams() {
  const handles = await getPageHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/pages/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const page = await getPage(handle);
  if (!page) return { title: "Not found" };

  return {
    title: page.seo.title || page.title,
    description: page.seo.description || page.bodySummary,
    alternates: { canonical: `/pages/${handle}` },
  };
}

export default async function ShopifyPage({
  params,
}: PageProps<"/pages/[handle]">) {
  const { handle } = await params;
  const page = await getPage(handle);

  if (!page) notFound();

  return (
    <>
      <PageHeader title={page.title} />
      <article className="shell-prose section">
        <div
          className="rte text-[15px]"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </article>
    </>
  );
}
