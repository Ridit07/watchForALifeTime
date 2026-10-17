import type { MetadataRoute } from "next";
import { getCollections, getProductHandles } from "@/lib/shopify";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [handles, collections] = await Promise.all([
    getProductHandles(),
    getCollections(),
  ]);

  const staticRoutes = ["", "/about", "/collections/all", "/search"].map(
    (path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  return [
    ...staticRoutes,
    ...collections.map((c) => ({
      url: `${site.url}/collections/${c.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...handles.map((h) => ({
      url: `${site.url}/products/${h}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
