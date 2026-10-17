import "server-only";
import {
  fetchCustomer,
  fetchCustomerId,
} from "./customer-account/customer";
import { readAccessToken } from "./customer-account/session";
import type { Customer } from "./shopify/customer";

/**
 * Sessions come from Shopify's New Customer Accounts (OAuth + PKCE). There is
 * no password anywhere in this app; `/account/authorize` starts the flow and
 * `/account/callback` finishes it.
 */
export async function getCustomerToken(): Promise<string | null> {
  return readAccessToken();
}

/**
 * The signed-in customer, or null. A rejected or expired token is treated as
 * signed-out rather than an error.
 */
export async function readCustomer(): Promise<Customer | null> {
  if (!(await readAccessToken())) return null;
  return fetchCustomer();
}

/**
 * The signed-in customer's id, or null. Use this for guards — reading the
 * full customer drags 25 orders along with it.
 */
export async function readCustomerId(): Promise<string | null> {
  if (!(await readAccessToken())) return null;
  return fetchCustomerId();
}
