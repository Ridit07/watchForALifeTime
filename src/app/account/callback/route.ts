import { NextResponse, type NextRequest } from "next/server";
import { APP_ORIGIN } from "@/lib/customer-account/config";
import {
  exchangeCode,
  saveSession,
  takeHandshake,
} from "@/lib/customer-account/session";
import { restoreCartForSession } from "@/lib/customer-cart";

/** Where Shopify sends the customer back once the code is accepted. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { verifier, state, returnTo } = await takeHandshake();

  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent(reason)}`, APP_ORIGIN),
    );

  if (params.get("error")) {
    return fail(params.get("error_description") || params.get("error")!);
  }

  const code = params.get("code");
  if (!code || !verifier) return fail("expired");

  // Guards against a forged callback: the state must be the one we issued.
  if (!state || params.get("state") !== state) return fail("state");

  const tokens = await exchangeCode(code, verifier);
  if (!tokens) return fail("exchange");

  await saveSession(tokens);

  // Hand the customer back whatever cart they had saved against the account.
  await restoreCartForSession();

  return NextResponse.redirect(new URL(returnTo, APP_ORIGIN));
}
