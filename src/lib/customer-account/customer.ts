import "server-only";
import { customerAccountFetch } from "./client";
import type {
  Customer,
  CustomerAddress,
  CustomerOrder,
} from "../shopify/customer";
import type { Money } from "../shopify/types";

/**
 * Reads against the Customer Account API, reshaped into the same `Customer`
 * the rest of the app already consumes. The field names differ from the
 * Storefront API in several places — `emailAddress` and `phoneNumber` are
 * objects, orders expose `number`/`totalPrice`/`subtotal`, and addresses use
 * `phoneNumber` — so the mapping happens here rather than leaking outwards.
 */

const ZERO: Money = { amount: "0.0", currencyCode: "INR" };

type RawAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phoneNumber: string | null;
} | null;

type RawOrder = {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  statusPageUrl: string;
  totalPrice: Money;
  subtotal: Money | null;
  totalTax: Money | null;
  totalShipping: Money | null;
  billingAddress: RawAddress;
  shippingAddress: RawAddress;
  lineItems: {
    edges: {
      node: {
        title: string;
        quantity: number;
        sku: string | null;
        variantTitle: string | null;
        price: Money | null;
        totalPrice: Money | null;
        image: { url: string; altText: string | null } | null;
      };
    }[];
  };
};

type RawCustomer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddress: { emailAddress: string | null } | null;
  phoneNumber: { phoneNumber: string | null } | null;
  defaultAddress: RawAddress;
  orders: { edges: { node: RawOrder }[] };
};

function address(a: RawAddress): CustomerAddress | null {
  if (!a) return null;
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    address1: a.address1,
    address2: a.address2,
    city: a.city,
    province: a.province,
    zip: a.zip,
    country: a.country,
    phone: a.phoneNumber,
  };
}

function order(o: RawOrder): CustomerOrder {
  return {
    id: o.id,
    name: o.name,
    orderNumber: o.number,
    processedAt: o.processedAt,
    email: null,
    financialStatus: o.financialStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    statusUrl: o.statusPageUrl,
    currentTotalPrice: o.totalPrice ?? ZERO,
    subtotalPrice: o.subtotal,
    totalShippingPrice: o.totalShipping,
    totalTax: o.totalTax,
    billingAddress: address(o.billingAddress),
    shippingAddress: address(o.shippingAddress),
    lineItems: o.lineItems.edges.map(({ node }) => ({
      title: node.title,
      quantity: node.quantity,
      // This API has no pre-discount total, so the line price stands in.
      originalTotalPrice: node.totalPrice ?? node.price ?? ZERO,
      discountedTotalPrice: node.totalPrice ?? node.price ?? ZERO,
      variant: {
        sku: node.sku,
        title: node.variantTitle,
        image: node.image,
        product: null,
      },
    })),
  };
}

const ADDRESS_FIELDS = /* GraphQL */ `
  id
  firstName
  lastName
  address1
  address2
  city
  province
  zip
  country
  phoneNumber
`;

/** Cheap session probe — used by guards, where the orders list is wasted work. */
export async function fetchCustomerId(): Promise<string | null> {
  const data = await customerAccountFetch<{ customer: { id: string } | null }>({
    query: /* GraphQL */ `
      query CustomerId {
        customer {
          id
        }
      }
    `,
  });

  return data?.customer?.id ?? null;
}

export async function fetchCustomer(): Promise<Customer | null> {
  const data = await customerAccountFetch<{ customer: RawCustomer | null }>({
    query: /* GraphQL */ `
      query CustomerDetail {
        customer {
          id
          firstName
          lastName
          emailAddress { emailAddress }
          phoneNumber { phoneNumber }
          defaultAddress { ${ADDRESS_FIELDS} }
          orders(first: 25, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                name
                number
                processedAt
                financialStatus
                fulfillmentStatus
                statusPageUrl
                totalPrice { amount currencyCode }
                subtotal { amount currencyCode }
                totalTax { amount currencyCode }
                totalShipping { amount currencyCode }
                billingAddress { ${ADDRESS_FIELDS} }
                shippingAddress { ${ADDRESS_FIELDS} }
                lineItems(first: 50) {
                  edges {
                    node {
                      title
                      quantity
                      sku
                      variantTitle
                      price { amount currencyCode }
                      totalPrice { amount currencyCode }
                      image { url altText }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  });

  const c = data?.customer;
  if (!c) return null;

  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.emailAddress?.emailAddress ?? null,
    phone: c.phoneNumber?.phoneNumber ?? null,
    defaultAddress: address(c.defaultAddress),
    orders: c.orders.edges.map(({ node }) => order(node)),
  };
}
