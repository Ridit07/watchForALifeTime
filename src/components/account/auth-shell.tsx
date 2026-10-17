import type { ReactNode } from "react";

/** Shared frame for the four signed-out auth screens. */
export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="text-center">
        <p className="eyebrow">{title === "Sign in" ? "Welcome back" : "Account"}</p>
        <h1 className="mt-3 font-display text-3xl font-light text-ink">
          {title}
        </h1>
        {intro && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>
        )}
      </div>
      <div aria-hidden className="rule my-9" />
      {children}
    </div>
  );
}
