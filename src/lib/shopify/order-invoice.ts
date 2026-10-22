import "server-only";
import { adminFetch } from "./admin";

/**
 * Invoices are issued by the showroom, not by this app. Staff attach the
 * signed PDF to the order in Shopify admin and it becomes downloadable here;
 * nothing is generated from the order data.
 *
 * The file lives in Shopify Files and the order points at it through a
 * `file_reference` metafield, so the document travels with the order and
 * there is no second store of record to keep in step.
 */
export const INVOICE_METAFIELD = {
  namespace: "custom",
  key: "invoice",
} as const;

export type UploadedInvoice = {
  url: string;
  mimeType: string;
  /** Bytes, when Shopify reports it — used only for the Content-Length hint. */
  size: number | null;
};

type RawFile = {
  url: string | null;
  mimeType: string | null;
  originalFileSize: number | null;
  fileStatus: string;
} | null;

/**
 * The invoice attached to an order, or null when none has been uploaded yet.
 *
 * Reads through the Admin API because the metafield belongs to the order
 * rather than the customer. Callers are responsible for proving the requester
 * is entitled to this order before handing anything back — this function will
 * happily return any order's invoice.
 */
export async function getUploadedInvoice(
  orderNumber: string,
): Promise<UploadedInvoice | null> {
  if (!/^\d+$/.test(orderNumber)) return null;

  const data = await adminFetch<{
    orders: { edges: { node: { metafield: { reference: RawFile } | null } }[] };
  }>({
    query: /* GraphQL */ `
      query OrderInvoice($query: String!, $namespace: String!, $key: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              metafield(namespace: $namespace, key: $key) {
                reference {
                  ... on GenericFile {
                    url
                    mimeType
                    originalFileSize
                    fileStatus
                  }
                }
              }
            }
          }
        }
      }
    `,
    // `name:#1002` is an exact match on the order name Shopify displays.
    variables: {
      query: `name:#${orderNumber}`,
      namespace: INVOICE_METAFIELD.namespace,
      key: INVOICE_METAFIELD.key,
    },
  });

  const file = data?.orders.edges[0]?.node.metafield?.reference;

  /* Shopify processes uploads asynchronously and only populates `url` once
     that finishes, so anything short of READY is treated as "not yet". */
  if (!file || file.fileStatus !== "READY" || !file.url) return null;

  return {
    url: file.url,
    mimeType: file.mimeType || "application/pdf",
    size: file.originalFileSize,
  };
}
