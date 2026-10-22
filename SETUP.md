# Shopify Setup — what I need from you

Follow these in order. Takes ~10 minutes in the Shopify admin.
**Do not paste any token into chat.** Put them straight into `.env.local` (step 4).

---

## Step 1 — Publish your products to a sales channel  ⚠️ DO THIS FIRST

Your inventory exists in admin, but the Storefront API returns **only products published
to the sales channel that the token belongs to**. Right now nothing is published, which is
why your public catalog shows zero products.

1. Admin → **Products** → select all (`Select all N products`)
2. **Actions → Publish** (or the `...` menu → *Make products available*)
3. Tick **Online Store** and **Headless** (Headless appears after Step 2)

Do the same for **Collections** — they publish separately and are easy to miss.

---

## Step 2 — Create the Headless storefront (gives the Storefront token)

Admin → **Settings → Apps and sales channels → Shopify App Store** → install **Headless**
(free, by Shopify) → **Create storefront**.

It generates two tokens:

| Token | Use |
|---|---|
| **Public access token** | What the site uses. Safe to expose — it ships to the browser. |
| **Private access token** | Server-only, higher rate limits. Optional. |

In the Headless channel → **Storefront API** → **Manage** → enable these scopes:

```
unauthenticated_read_product_listings        # products + collections   (REQUIRED)
unauthenticated_read_product_inventory       # stock / sold-out badges  (REQUIRED)
unauthenticated_read_product_tags            # filters + faceted search (REQUIRED)
unauthenticated_write_checkouts              # create cart              (REQUIRED)
unauthenticated_read_checkouts               # read cart                (REQUIRED)
unauthenticated_read_content                 # pages, blogs, policies   (REQUIRED)
unauthenticated_read_metaobjects             # editable homepage blocks (recommended)
unauthenticated_read_product_pickup_locations  # "available at showroom" (optional)
unauthenticated_read_selling_plans           # only if you ever sell subscriptions
```

> Alternative if you'd rather not install Headless: **Settings → Apps and sales channels →
> Develop apps → Create an app** → *Configuration* → *Storefront API integration* → same
> scopes → *API credentials* → **Install app** → copy the Storefront API access token.
> If you go this route you must publish products to **that custom app's channel**, not Headless.

---

## Step 3 — Admin API token (optional, for cache revalidation)

Only needed so the site updates within seconds of you editing a product, instead of waiting
for the ISR timer. Skip it and the site still works — it just refreshes on a 60s interval.

**Develop apps → your app → Configuration → Admin API integration**, enable:

```
read_products         # product/collection webhooks
read_inventory        # stock-level webhooks
read_content          # pages + blog articles
read_locations        # showroom address / store locator
read_metaobjects      # custom content
```

Webhooks have no scope of their own — you get `products/update` by holding `read_products`.

**Do NOT grant** `write_products`, `read_orders`, `read_customers`, or anything payment
related. A storefront has no business holding those, and `read_orders` is a protected scope
that triggers Shopify data-protection review.

The Admin token is a **real secret**. Rotate it when the build is done.

---

## Step 4 — Create `.env.local` in this folder

```bash
# --- required ---
SHOPIFY_STORE_DOMAIN=xxxxxxxx.myshopify.com   # the .myshopify.com host, NOT watchforalifetime.in
SHOPIFY_STOREFRONT_ACCESS_TOKEN=              # Step 2, public access token
SHOPIFY_API_VERSION=2026-10

# --- optional ---
SHOPIFY_ADMIN_ACCESS_TOKEN=                   # Step 3, starts with shpat_
SHOPIFY_REVALIDATION_SECRET=                  # any random string, e.g. `openssl rand -hex 24`

# --- site ---
NEXT_PUBLIC_SITE_URL=https://watchforalifetime.in
NEXT_PUBLIC_STORE_NAME=The Watch For A Life Time
```

Find your `.myshopify.com` domain at **Settings → Domains**.

---

## Step 5 — Commerce settings that must be live for checkout to work

Checkout is Shopify's hosted page (custom checkout is Plus-only), so these are configured
in admin, not in code:

- [ ] **Payments** — Shopify Payments or Razorpay/PayU activated
- [ ] **Shipping zones** — at minimum an India zone with rates
- [ ] **Taxes** — GST configured, and decide **tax-inclusive vs exclusive** pricing
- [ ] **Checkout branding** — Settings → Checkout → Customize: set black/beige + your logo
      so the handoff doesn't feel like leaving the site
- [ ] **Policies** — Settings → Policies: refund, privacy, terms, shipping.
      I pull these through the API, so whatever you write there appears on the site.

---

## Step 6 — Brand + content I still need from you

| Item | Why |
|---|---|
| **Logo** (SVG preferred, or 1000px+ PNG) | header, favicon, OG image, checkout |
| **Showroom photos** | the heritage/about section — this is your biggest differentiator |
| **Brands you carry** | drives the nav structure (Titan / Casio / Seiko / Fossil…) |
| **Categories** | wrist watches / wall clocks / straps / servicing? |
| **Warranty terms** | highest-impact trust element on a watch PDP |
| **Showroom address + hours + phone** | store locator, schema.org LocalBusiness, footer |
| **Founding year** | "one of Gurgaon's earliest" is strong — a date makes it stronger |

---

## Step 7 — Invoices (one-time setup, then one upload per order)

Invoices are **not generated by the site**. The showroom issues the PDF and
attaches it to the order; the customer then sees a **Download invoice** button
on their order page. Until you upload one, they see "Your invoice will appear
here once the showroom has issued it."

### One-time: create the metafield

1. Shopify admin → **Settings → Custom data → Orders**
2. **Add definition**
   - Name: `Invoice`
   - Namespace and key: **`custom.invoice`** (must match exactly)
   - Type: **File**
   - Under the file type's validation, limit it to **PDF** (optional but tidy)
3. **Save**

### Per order: upload the PDF

1. Open the order in Shopify admin
2. Scroll to the **Metafields** section → **Invoice**
3. Upload the PDF → **Save**

Shopify processes the upload in the background. The download appears on the
customer's order page once Shopify marks the file ready, which is normally a
few seconds.

### Notes

- The customer download is served from this site, not from Shopify's CDN, and
  only to the signed-in customer who owns that order. The underlying Shopify
  file URL is never exposed, so the invoice cannot be forwarded as a link.
- Replacing the file on the order replaces what the customer downloads — there
  is no separate copy to update.
- The order page still shows items, addresses and totals, but it is labelled a
  summary, not a tax invoice. Your uploaded PDF is the tax document.

---

## What you do NOT need to give me

- Shopify admin login / password
- Any payment gateway keys
- Customer or order data
