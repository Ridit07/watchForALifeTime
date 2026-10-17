import "server-only";
import { endpoints } from "./config";
import { readAccessToken, refreshSession } from "./session";

/**
 * Customer Account API request, authenticated as the signed-in customer.
 *
 * Returns null rather than throwing when there is no usable session, so a
 * page can treat "not signed in" and "token expired" the same way. An
 * expired access token is refreshed once and the call retried.
 */
export async function customerAccountFetch<T>({
  query,
  variables,
  token,
  retry = true,
}: {
  query: string;
  variables?: Record<string, unknown>;
  token?: string;
  retry?: boolean;
}): Promise<T | null> {
  const accessToken = token ?? (await readAccessToken());
  if (!accessToken) return null;

  const { graphql } = await endpoints();

  let res: Response;
  try {
    res = await fetch(graphql, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Not a Bearer prefix — the Customer Account API takes the raw token.
        Authorization: accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (res.status === 401 && retry && !token) {
    const refreshed = await refreshSession();
    if (!refreshed) return null;
    return customerAccountFetch<T>({
      query,
      variables,
      token: refreshed,
      retry: false,
    });
  }

  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as {
    data?: T;
    errors?: unknown[];
  } | null;

  if (!json || json.errors?.length) return null;

  return json.data ?? null;
}
