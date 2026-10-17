# The Watch For A Life Time — storefront

Headless Shopify storefront. Next.js 16 (App Router, Cache Components) ·
React 19 · Tailwind v4 · TypeScript.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Credentials live in `.env.local` — see `SETUP.md` for how to generate them.

## How the data flows

```
Shopify Admin ──► Storefront GraphQL API ──► src/lib/shopify ──► pages
                                                   │
Shopify webhook ──► /api/revalidate ──► revalidateTag() ─┘
```

- **Catalog reads** (`getProducts`, `getCollection`, `getPage`, policies) are
  `"use cache"` functions tagged `products` / `collections` / `pages` / `shop`.
  They prerender at build and refresh hourly, or instantly when a webhook fires.
- **Cart reads and writes** are never cached. The cart id lives in an
  httpOnly cookie; mutations run as server actions in `src/components/cart/`.
- **Checkout** is Shopify's hosted checkout. `/cart` links to `cart.checkoutUrl`.
  Custom checkout is Shopify Plus only, so this handoff is not optional.

## Layout

```
src/
  app/
    page.tsx                     home
    collections/[handle]/        `all` is virtual; others come from Shopify
    products/[handle]/           PDP + JSON-LD + related
    pages/[handle]/              Shopify pages (contact, …)
    policies/[handle]/           refund / privacy / shipping / terms
    cart/  search/  about/
    api/revalidate/              HMAC-verified Shopify webhook
    sitemap.ts  robots.ts
  components/
    cart/                        actions.ts (server), add-to-cart, line item
    header · footer · hero · product-card · product-gallery · …
  lib/
    shopify/   client · fragments · queries · types
    site.ts    brand copy and the PDP spec field map
    utils.ts   INR formatting, title casing, discounts
```

## Design tokens

Defined once in `src/app/globals.css` under `@theme`:

| Token | Use |
|---|---|
| `ink`, `ink-soft`, `charcoal` | header, footer, hero, buttons |
| `sand-50 … sand-400` | page canvas, borders, muted surfaces |
| `brass`, `brass-light`, `brass-dark` | accents, matched to the gold cases |
| `tile` | product image tiles |

Product tiles are near-white (`tile`) rather than beige on purpose: the
catalogue mixes white-cutout shots with coloured studio shots, and a beige tile
makes the cutouts look like patches.

## Cache Components notes

`cacheComponents: true` is on. Two rules follow from it:

1. Anything reading `cookies()`, `params` or `searchParams` must sit inside
   `<Suspense>`, or the route cannot prerender. See `src/app/search/page.tsx`.
2. `new Date()` cannot be called during prerender. The footer's copyright year
   is a `"use cache"` component refreshed daily.

## Webhooks

Register in Shopify admin → Settings → Notifications → Webhooks, pointing at
`https://<your-domain>/api/revalidate`:

- `products/create`, `products/update`, `products/delete`
- `collections/create`, `collections/update`, `collections/delete`

Each is verified against `SHOPIFY_REVALIDATION_SECRET` using the
`x-shopify-hmac-sha256` header. Set that secret to the app's webhook signing
secret from Shopify, not an arbitrary string.

## Deploying

Vercel, with the `.env.local` values added as project environment variables.
`NEXT_PUBLIC_SITE_URL` must be the production origin — canonical URLs,
JSON-LD and the sitemap all derive from it.
