import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/auth-shell";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/** Plain-English versions of what the callback can hand back. */
const REASONS: Record<string, string> = {
  expired: "That sign-in link timed out. Please try again.",
  state: "We could not verify that sign-in. Please start again.",
  exchange: "Shopify would not complete the sign-in. Please try again.",
  access_denied: "Sign-in was cancelled.",
};

async function Body({
  searchParams,
}: {
  searchParams: PageProps<"/account/login">["searchParams"];
}) {
  const { error, next } = await searchParams;
  const reason = typeof error === "string" ? error : null;
  const target =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/account";

  return (
    <>
      {reason && (
        <p role="alert" className="mb-6 text-center text-sm text-red-800">
          {REASONS[reason] ?? reason}
        </p>
      )}

      <p className="text-center text-sm leading-relaxed text-muted">
        We will email you a one-time code — no password to remember.
      </p>

      <a
        href={`/account/authorize?next=${encodeURIComponent(target)}`}
        className="btn btn-primary mt-7 w-full"
      >
        Continue
      </a>
    </>
  );
}

export default function LoginPage({
  searchParams,
}: PageProps<"/account/login">) {
  return (
    <AuthShell
      title="Sign in"
      intro="Access your orders and saved details."
    >
      <Suspense fallback={<div className="h-28 animate-pulse bg-sand-200" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
