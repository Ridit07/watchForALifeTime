import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * `DISABLE_CACHE=1` drops every catalogue lifetime to a second, so a stock
 * edit in the Shopify admin shows on the next page load.
 *
 * Development only, deliberately. A one-second lifetime cannot be baked
 * into a static prerender — the footer reads collections and policies
 * outside any Suspense boundary — so `next build` would fail with
 * "uncached or runtime data during prerendering". Production freshness is
 * the revalidate webhook's job, not a short TTL's.
 *
 * The phase is checked rather than NODE_ENV because NODE_ENV is not yet set
 * when this file is evaluated during a build.
 */
const nextConfig = (phase: string): NextConfig => {
  const noCache =
    process.env.DISABLE_CACHE === "1" && phase === PHASE_DEVELOPMENT_SERVER;

  return {
    cacheComponents: true,
    cacheLife: {
      /* Products, collections, search — anything that moves with stock. */
      catalog: noCache
        ? { stale: 1, revalidate: 1, expire: 60 }
        : { stale: 300, revalidate: 3600, expire: 86400 },
      /* Shop info, pages, policies — edited rarely. */
      content: noCache
        ? { stale: 1, revalidate: 1, expire: 60 }
        : { stale: 300, revalidate: 86400, expire: 604800 },
    },
    partialPrefetching: true,
    /* Development runs behind a Cloudflare quick tunnel so Shopify has an
       HTTPS callback to redirect to. Next blocks both HMR and Server Actions
       when the browser's origin does not match the server's own host, which
       a tunnel always trips. */
    allowedDevOrigins: ["*.trycloudflare.com"],
    experimental: {
      serverActions: {
        allowedOrigins: ["*.trycloudflare.com"],
      },
    },
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
      ],
      formats: ["image/avif", "image/webp"],
    },
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=()",
            },
          ],
        },
      ];
    },
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
};

export default nextConfig;
