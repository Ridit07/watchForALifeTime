import { metafieldIdentifiers } from "../site";

/** Built from the spec config so the query and the rendered table cannot drift. */
const METAFIELD_IDENTIFIERS = `[${metafieldIdentifiers
  .map((f) => `{ namespace: "${f.namespace}", key: "${f.key}" }`)
  .join(" ")}]`;

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    productType
    tags
    availableForSale
    totalInventory
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    featuredImage { ...ImageFields }
    # Up to six, so the card can cycle through the gallery on hover.
    images(first: 6) { edges { node { ...ImageFields } } }
    # Catalogue facets. Shopify's product search cannot filter on
    # metafields (a nonsense key is silently ignored), so the values come
    # down with the card and the narrowing happens server-side in Node.
    metafields(identifiers: [
      { namespace: "shopify", key: "target-gender" }
      { namespace: "shopify", key: "watch-display" }
    ]) {
      key
      namespace
      value
      type
      references(first: 5) {
        edges { node { ... on Metaobject { fields { key value } } } }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const PRODUCT_DETAIL_FRAGMENT = /* GraphQL */ `
  fragment ProductDetailFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    totalInventory
    updatedAt
    seo { title description }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    featuredImage { ...ImageFields }
    images(first: 12) { edges { node { ...ImageFields } } }
    options { id name optionValues { name } }
    variants(first: 100) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          selectedOptions { name value }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { ...ImageFields }
        }
      }
    }
    metafields(identifiers: ${METAFIELD_IDENTIFIERS}) {
      key
      namespace
      value
      type
      references(first: 10) {
        edges {
          node {
            ... on Metaobject {
              fields { key value }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount { amount currencyCode }
            amountPerQuantity { amount currencyCode }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              availableForSale
              quantityAvailable
              selectedOptions { name value }
              image { ...ImageFields }
              product { handle title vendor }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;
