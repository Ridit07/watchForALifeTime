import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
      <header className="bg-ink py-16 text-center text-sand-100">
        <h1 className="mx-auto max-w-2xl px-4 font-display text-4xl font-light text-sand-50">
          {page.title}
        </h1>
      </header>
      <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div
          className="rte text-[15px]"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </article>
    </>
  );
}
