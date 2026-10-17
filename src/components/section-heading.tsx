import Link from "next/link";
import { ArrowIcon } from "./icons";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 font-display text-3xl font-light text-ink sm:text-4xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2 text-xs tracking-[0.15em] text-muted uppercase transition-colors hover:text-brass-dark sm:flex"
        >
          {linkLabel}
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
