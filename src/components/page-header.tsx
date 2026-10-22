/**
 * The masthead every secondary page opens with. An olive band, centred, with
 * enough air above and below that the heading is the only thing in view when
 * the page lands.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="border-b border-sand-50/10 bg-olive py-20 text-center md:py-28">
      <div className="shell-prose">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-6 font-display text-[2.5rem] leading-tight font-light text-sand-50 sm:text-[3.25rem]">
          {title}
        </h1>
        {intro && (
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-[1.9] text-muted-light">
            {intro}
          </p>
        )}
      </div>
    </header>
  );
}
