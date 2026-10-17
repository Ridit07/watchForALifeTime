import "server-only";
import { cookies } from "next/headers";
import {
  CUSTOMER_CLIENT_ID,
  endpoints,
  REDIRECT_URI,
} from "./config";

/**
 * The customer session. Three cookies rather than one so the refresh token is
 * never read on an ordinary page render:
 *
 *   customerToken    — the access token, used on every API call
 *   customerRefresh  — exchanged for a new access token when the first expires
 *   customerIdToken  — needed to end the session on Shopify at logout
 */
const ACCESS = "customerToken";
const REFRESH = "customerRefresh";
const ID_TOKEN = "customerIdToken";

/** Every cookie that makes up a session, for clearing them in one go. */
export const SESSION_COOKIES = [ACCESS, REFRESH, ID_TOKEN] as const;

/** Short-lived values used only between /authorize and /callback. */
const VERIFIER = "oauthVerifier";
const STATE = "oauthState";
const RETURN_TO = "oauthReturnTo";

const secure = process.env.NODE_ENV === "production" || true;

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Shopify demands an HTTPS redirect URI, so the cookie is always secure —
  // including in dev, which runs `next dev --experimental-https`.
  secure,
  path: "/",
};

export type TokenSet = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresIn: number;
};

export async function saveSession(t: TokenSet): Promise<void> {
  const store = await cookies();

  /* Expire our cookie a minute early so a request never starts with a token
     that dies mid-flight. */
  store.set(ACCESS, t.accessToken, {
    ...base,
    maxAge: Math.max(60, t.expiresIn - 60),
  });

  if (t.refreshToken) {
    store.set(REFRESH, t.refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  }
  if (t.idToken) {
    store.set(ID_TOKEN, t.idToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  for (const name of SESSION_COOKIES) store.delete(name);
}

export async function readAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH)?.value ?? null;
}

export async function readIdToken(): Promise<string | null> {
  return (await cookies()).get(ID_TOKEN)?.value ?? null;
}

/* ---------------------------------------------------------------- *
 * PKCE
 * ---------------------------------------------------------------- */

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Buffer.from(b)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomValue(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64url(digest);
}

/**
 * The verifier and state live in httpOnly cookies for the length of the
 * round trip. A database would be the alternative, but this app has none and
 * the values are single-use, short-lived and bound to the one browser.
 */
export async function saveHandshake(
  verifier: string,
  state: string,
  returnTo: string,
): Promise<void> {
  const store = await cookies();
  const opts = { ...base, maxAge: 600 };
  store.set(VERIFIER, verifier, opts);
  store.set(STATE, state, opts);
  store.set(RETURN_TO, returnTo, opts);
}

export async function takeHandshake(): Promise<{
  verifier: string | null;
  state: string | null;
  returnTo: string;
}> {
  const store = await cookies();
  const verifier = store.get(VERIFIER)?.value ?? null;
  const state = store.get(STATE)?.value ?? null;
  const returnTo = store.get(RETURN_TO)?.value || "/account";

  // Single use: a replayed code must not find a verifier waiting for it.
  for (const n of [VERIFIER, STATE, RETURN_TO]) store.delete(n);

  return { verifier, state, returnTo };
}

/* ---------------------------------------------------------------- *
 * Token exchange
 * ---------------------------------------------------------------- */

type RawToken = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function postToken(body: URLSearchParams): Promise<TokenSet | null> {
  const { token } = await endpoints();

  const res = await fetch(token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Public clients must send Origin; Shopify rejects the call without it.
      Origin: new URL(REDIRECT_URI).origin,
    },
    body,
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as RawToken | null;

  if (!res.ok || !json?.access_token) return null;

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    idToken: json.id_token ?? null,
    expiresIn: json.expires_in ?? 3600,
  };
}

export async function exchangeCode(
  code: string,
  verifier: string,
): Promise<TokenSet | null> {
  if (!CUSTOMER_CLIENT_ID) return null;

  return postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CUSTOMER_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier: verifier,
    }),
  );
}

export async function refreshSession(): Promise<string | null> {
  const refresh = await readRefreshToken();
  if (!refresh || !CUSTOMER_CLIENT_ID) return null;

  const next = await postToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CUSTOMER_CLIENT_ID,
      refresh_token: refresh,
    }),
  );

  if (!next) return null;

  await saveSession(next);
  return next.accessToken;
}
