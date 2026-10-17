/**
 * A plain link, not a form: signing out ends at Shopify's logout endpoint, so
 * it needs a real browser navigation. Routing it through a server action
 * would have the client router fetch the redirect instead of following it,
 * and the Set-Cookie headers that clear the session would never land.
 */
export function LogoutButton() {
  return (
    <a
      href="/account/logout"
      className="text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 transition-colors hover:text-sand-50"
    >
      Sign out
    </a>
  );
}
