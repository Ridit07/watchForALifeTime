import type { Money } from "./types";

export type CustomerUserError = {
  code: string | null;
  field: string[] | null;
  message: string;
};

export type CustomerAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
};

export type OrderLineItem = {
  title: string;
  quantity: number;
  originalTotalPrice: Money;
  discountedTotalPrice: Money;
  variant: {
    sku: string | null;
    title: string | null;
    image: { url: string; altText: string | null } | null;
    product: { handle: string; vendor: string | null } | null;
  } | null;
};

export type CustomerOrder = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  email: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string;
  statusUrl: string;
  currentTotalPrice: Money;
  subtotalPrice: Money | null;
  totalShippingPrice: Money | null;
  totalTax: Money | null;
  billingAddress: CustomerAddress | null;
  shippingAddress: CustomerAddress | null;
  lineItems: OrderLineItem[];
};

export type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  defaultAddress: CustomerAddress | null;
  orders: CustomerOrder[];
};

/*
 * Authentication lives in `lib/customer-account/` now. Shopify removed the
 * password mutations (`customerAccessTokenCreate`, `customerRecover`,
 * `customerResetByUrl`) in API 2026-01, so only the shared shapes remain
 * here — both the Storefront reads and the Customer Account API map onto
 * these types.
 */
