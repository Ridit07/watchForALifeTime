import { assurances } from "@/lib/site";

export function Assurances() {
  return (
    <section className="border-y border-sand-300 bg-sand-50">
      <div className="mx-auto grid max-w-7xl gap-px bg-sand-300 sm:grid-cols-2 lg:grid-cols-4">
        {assurances.map((a) => (
          <div key={a.title} className="bg-sand-50 px-6 py-8">
            <h3 className="font-display text-lg text-ink">{a.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {a.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
