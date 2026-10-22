import Image from "next/image";
import { site } from "@/lib/site";
import { cx } from "@/lib/utils";

/* Intrinsic sizes of the two assets generated from the supplied artwork,
   with the black card keyed out to transparency. */
const LOCKUP = { w: 479, h: 297 };
const MARK = { w: 199, h: 91 };

/**
 * The full lockup — watch, wordmark and "Est. 1982". Sized by height, since
 * that is what has to line up with the rest of a header or footer row.
 */
export function Logo({
  height,
  className,
  priority = false,
}: {
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt={site.name}
      width={Math.round((height * LOCKUP.w) / LOCKUP.h)}
      height={height}
      priority={priority}
      className={className}
    />
  );
}

/**
 * The watch on its own, for places where the wordmark would either be
 * unreadably small or repeat a heading that already says the name.
 */
export function LogoMark({
  height,
  className,
}: {
  height: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      aria-hidden
      width={Math.round((height * MARK.w) / MARK.h)}
      height={height}
      className={cx("opacity-90", className)}
    />
  );
}
