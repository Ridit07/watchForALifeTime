import Link from "next/link";
import { ArrowIcon } from "./icons";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <div className="mb-16 text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-5 font-display text-[2.25rem] leading-tight font-light text-sand-50 sm:text-5xl">
          {title}
        </h2>
        <div aria-hidden className="rule mx-auto mt-9 w-24" />
      </div>
    );
  }

  return (
    <div className="mb-14 flex items-end justify-between gap-8 border-b border-sand-50/10 pb-8">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-5 font-display text-[2.25rem] leading-tight font-light text-sand-50 sm:text-5xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2.5 pb-2 text-[11px] tracking-luxe text-muted-light uppercase transition-colors hover:text-brass-light sm:flex"
        >
          {linkLabel}
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
