/**
 * Brand constants. Everything here that is editable in Shopify is read from
 * the API instead — this file only holds what Shopify has nowhere to store.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "The Watch For A Life Time",
  shortName: "Life Time",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://watchforalifetime.in",
  tagline: "Timepieces worth keeping",
  /* Sourced from the existing storefront's about section. */
  heritage:
    "Life Time, established as one of Gurgaon's earliest watch showrooms by Mr. Naresh Chand Jain, offers an extensive collection of watches and clocks for every taste.",
  description:
    "One of Gurgaon's earliest watch showrooms. An extensive collection of watches and clocks, chosen for a lifetime of wear.",

  /* Cashfree-hosted payment page. Opens in a new tab — it is a separate
     service, and we do not want to lose the visitor's place in the shop. */
  payUrl: "https://payments.cashfree.com/forms/watchforalifetime",

  /* Where the contact form posts. Formspree keeps the recipient address on
     their side; the form id lives in the environment. */
  formspreeId: process.env.NEXT_PUBLIC_FORMSPREE_ID || "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
} as const;

/** Header and footer navigation, in order. */
export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/collections/all", label: "All Watches" },
  { href: "/pages/contact", label: "Contact" },
] as const;

export const assurances = [
  {
    title: "100% Authentic",
    body: "Every piece sourced directly from the brand, with full manufacturer warranty.",
  },
  {
    title: "Free Gurugram Delivery",
    body: "We deliver within Gurugram only, and delivery is always free.",
  },
  {
    title: "7-Day Exchange",
    body: "Exchange at the showroom within 7 days, tags intact and unworn. No refunds.",
  },
  {
    title: "Showroom Service",
    body: "In-house battery, strap and servicing support at our Gurugram store.",
  },
] as const;

/** One line, used wherever shipping has to be stated briefly. */
export const shippingLine =
  "Free delivery within Gurugram · Exchange at the showroom within 7 days";

/**
 * PDP spec rows, in display order.
 *
 * `shopify.*` are Shopify's standard taxonomy metafields: their type is
 * `list.metaobject_reference`, so the value lives on a referenced metaobject's
 * `label` field rather than on the metafield itself.
 * `custom.*` are the store's own definitions and hold plain values.
 *
 * This list drives both the GraphQL query and the rendered table — adding a
 * row here is the only change needed to surface a new spec.
 */
export const specFields = [
  { namespace: "shopify", key: "watch-movement", label: "Movement" },
  { namespace: "shopify", key: "watch-display", label: "Display" },
  { namespace: "shopify", key: "case-material", label: "Case material" },
  { namespace: "custom", key: "case_size", label: "Case size" },
  { namespace: "shopify", key: "dial-color", label: "Dial colour" },
  { namespace: "custom", key: "strap_material", label: "Strap material" },
  { namespace: "shopify", key: "band-color", label: "Band colour" },
  { namespace: "shopify", key: "watch-features", label: "Features" },
  { namespace: "custom", key: "water_resistance", label: "Water resistance" },
  { namespace: "shopify", key: "target-gender", label: "Wearer" },
] as const;

/** MRP is queried alongside the spec rows but displayed with the price. */
export const MRP_FIELD = { namespace: "custom", key: "mrp" } as const;

/** Every identifier the PDP asks Shopify for, in query order. */
export const metafieldIdentifiers = [...specFields, MRP_FIELD];
