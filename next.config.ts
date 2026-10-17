import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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

export default nextConfig;
