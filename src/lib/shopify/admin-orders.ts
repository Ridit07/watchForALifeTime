import "server-only";
import { adminFetch } from "./admin";
import type { CustomerAddress, CustomerOrder } from "./customer";
import type { Money } from "./types";

type MoneySet = { shopMoney: Money } | null;

type RawAdminAddress = {
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
} | null;

type RawAdminOrder = {
  id: string;
  name: string;
  processedAt: string;
  email: string | null;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  currentSubtotalPriceSet: MoneySet;
  totalShippingPriceSet: MoneySet;
  currentTotalTaxSet: MoneySet;
  currentTotalPriceSet: MoneySet;
  billingAddress: RawAdminAddress;
  shippingAddress: RawAdminAddress;
  lineItems: {
    edges: {
      node: {
        title: string;
        quantity: number;
        sku: string | null;
        vendor: string | null;
        variantTitle: string | null;
        originalTotalSet: MoneySet;
        discountedTotalSet: MoneySet;
      };
    }[];
  };
};

const ZERO: Money = { amount: "0.0", currencyCode: "INR" };

function money(set: MoneySet): Money {
  return set?.shopMoney ?? ZERO;
}

function address(a: RawAdminAddress): CustomerAddress | null {
  if (!a) return null;
  return { id: "", ...a };
}

/**
 * Fetches an order by its number and reshapes it into the same `CustomerOrder`
 * the Storefront API returns, so `renderInvoicePdf` produces a document
 * identical to the customer's — one template, not two drifting copies.
 */
export async function getOrderForInvoice(
  orderNumber: string,
): Promise<CustomerOrder | null> {
  const data = await adminFetch<{
    orders: { edges: { node: RawAdminOrder }[] };
  }>({
    query: /* GraphQL */ `
      query InvoiceOrder($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
              name
              processedAt
              email
              displayFinancialStatus
              displayFulfillmentStatus
              currentSubtotalPriceSet { shopMoney { amount currencyCode } }
              totalShippingPriceSet { shopMoney { amount currencyCode } }
              currentTotalTaxSet { shopMoney { amount currencyCode } }
              currentTotalPriceSet { shopMoney { amount currencyCode } }
              billingAddress {
                firstName lastName address1 address2
                city province zip country phone
              }
              shippingAddress {
                firstName lastName address1 address2
                city province zip country phone
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    sku
                    vendor
                    variantTitle
                    originalTotalSet { shopMoney { amount currencyCode } }
                    discountedTotalSet { shopMoney { amount currencyCode } }
                  }
                }
              }
            }
          }
        }
      }
    `,
    // `name:#1002` is an exact match on the order name Shopify displays.
    variables: { query: `name:#${orderNumber.replace(/^#/, "")}` },
  });

  const order = data?.orders.edges[0]?.node;
  if (!order) return null;

  return {
    id: order.id,
    name: order.name,
    orderNumber: Number(order.name.replace(/^#/, "")) || 0,
    processedAt: order.processedAt,
    email: order.email,
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus ?? "UNFULFILLED",
    statusUrl: "",
    currentTotalPrice: money(order.currentTotalPriceSet),
    subtotalPrice: money(order.currentSubtotalPriceSet),
    totalShippingPrice: money(order.totalShippingPriceSet),
    totalTax: money(order.currentTotalTaxSet),
    billingAddress: address(order.billingAddress),
    shippingAddress: address(order.shippingAddress),
    lineItems: order.lineItems.edges.map(({ node }) => ({
      title: node.title,
      quantity: node.quantity,
      originalTotalPrice: money(node.originalTotalSet),
      discountedTotalPrice: money(node.discountedTotalSet),
      variant: {
        sku: node.sku,
        title: node.variantTitle,
        image: null,
        product: node.vendor ? { handle: "", vendor: node.vendor } : null,
      },
    })),
  };
}
