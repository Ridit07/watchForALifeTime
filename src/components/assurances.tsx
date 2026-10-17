import { assurances } from "@/lib/site";

export function Assurances() {
  return (
    <section className="border-y border-white/10 bg-ink-soft">
      <div className="mx-auto grid max-w-7xl gap-px bg-charcoal sm:grid-cols-2 lg:grid-cols-4">
        {assurances.map((a) => (
          <div key={a.title} className="bg-ink-soft px-6 py-8">
            <h3 className="font-display text-lg text-sand-50">{a.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-light">
              {a.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
