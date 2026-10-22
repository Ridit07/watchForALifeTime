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
    <div className="mx-auto max-w-md px-6 py-24 sm:px-10 md:py-32">
      <div className="text-center">
        <p className="eyebrow">{title === "Sign in" ? "Welcome back" : "Account"}</p>
        <h1 className="mt-5 font-display text-[2.25rem] font-light text-sand-50">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 text-sm leading-[1.9] text-muted-light">{intro}</p>
        )}
      </div>
      <div aria-hidden className="rule my-12" />
      {children}
    </div>
  );
}
