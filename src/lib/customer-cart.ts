import "server-only";
import { adminFetch } from "./shopify/admin";
import { addCartLines, getCart } from "./shopify";
import { getCartId, setCartId } from "./cart";
import { readCustomerId } from "./auth";

/**
 * Where a signed-in customer's cart id is kept.
 *
 * Shopify stores the cart itself, but the Storefront API offers no way to ask
 * "which cart belongs to this customer" — the `Customer` type has no cart
 * field, so a cart is reachable only by id. Parking that id in a customer
 * metafield makes Shopify the store of record for the association too, which
 * is what lets a second browser find a cart it never created.
 */
export const CART_METAFIELD = {
  namespace: "headless",
  key: "cart_id",
  type: "single_line_text_field",
} as const;

/** Reads the cart id saved against a customer, if any. */
export async function loadCartIdForCustomer(
  customerId: string,
): Promise<string | null> {
  const data = await adminFetch<{
    customer: { metafield: { value: string } | null } | null;
  }>({
    query: /* GraphQL */ `
      query CustomerCartId($id: ID!, $namespace: String!, $key: String!) {
        customer(id: $id) {
          metafield(namespace: $namespace, key: $key) {
            value
          }
        }
      }
    `,
    variables: {
      id: customerId,
      namespace: CART_METAFIELD.namespace,
      key: CART_METAFIELD.key,
    },
  });

  return data?.customer?.metafield?.value || null;
}

/** Points a customer at a cart. Silently does nothing if Shopify refuses. */
export async function saveCartIdForCustomer(
  customerId: string,
  cartId: string,
): Promise<void> {
  await adminFetch({
    query: /* GraphQL */ `
      mutation SaveCartId($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors {
            message
          }
        }
      }
    `,
    variables: {
      metafields: [
        {
          ownerId: customerId,
          namespace: CART_METAFIELD.namespace,
          key: CART_METAFIELD.key,
          type: CART_METAFIELD.type,
          value: cartId,
        },
      ],
    },
  });
}

/** Forgets the saved cart — used once a cart has been merged away. */
export async function clearCartIdForCustomer(
  customerId: string,
): Promise<void> {
  await adminFetch({
    query: /* GraphQL */ `
      mutation ClearCartId($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          userErrors {
            message
          }
        }
      }
    `,
    variables: {
      metafields: [
        {
          ownerId: customerId,
          namespace: CART_METAFIELD.namespace,
          key: CART_METAFIELD.key,
        },
      ],
    },
  });
}

/**
 * Decides which cart a customer should be holding after signing in, merging
 * when they arrive with one and already had another saved.
 *
 * Returns the cart id to put in the visitor's cookie, or null to leave things
 * as they are. Nothing here is allowed to throw: a failure to restore a cart
 * must not block the sign-in itself.
 */
export async function reconcileCartOnLogin(
  customerId: string,
  localCartId: string | null,
): Promise<string | null> {
  let savedCartId: string | null = null;

  try {
    savedCartId = await loadCartIdForCustomer(customerId);
  } catch {
    return null;
  }

  try {
    // Nothing saved — adopt whatever this browser is carrying.
    if (!savedCartId) {
      if (localCartId) await saveCartIdForCustomer(customerId, localCartId);
      return null;
    }

    // Saved cart may have expired or been checked out since.
    const saved = await getCart(savedCartId);
    if (!saved) {
      if (localCartId) await saveCartIdForCustomer(customerId, localCartId);
      return null;
    }

    // Signed in on a fresh browser: hand back the saved cart.
    if (!localCartId) return savedCartId;
    if (localCartId === savedCartId) return null;

    const local = await getCart(localCartId);
    if (!local || local.lines.length === 0) return savedCartId;

    /* Both carts hold something. Merge the local lines into the saved cart
       rather than picking a winner — silently dropping items someone just
       added is the worse surprise. Shopify folds duplicate merchandise ids
       into a single line, so quantities add up rather than appearing twice. */
    await addCartLines(
      savedCartId,
      local.lines.map((line) => ({
        merchandiseId: line.merchandise.id,
        quantity: line.quantity,
      })),
    );

    return savedCartId;
  } catch {
    // Leave the visitor on the cart they already had.
    return null;
  }
}

/**
 * Called straight after sign-in: hands the customer back the cart saved
 * against their account, merging in anything this browser was already
 * carrying. Best-effort — a cart that cannot be restored must never cost
 * someone their sign-in.
 */
export async function restoreCartForSession(): Promise<void> {
  try {
    const customerId = await readCustomerId();
    if (!customerId) return;

    const cartId = await reconcileCartOnLogin(customerId, await getCartId());
    if (cartId) await setCartId(cartId);
  } catch {
    /* Leave the bag as it was. */
  }
}
