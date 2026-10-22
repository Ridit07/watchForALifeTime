import { assurances } from "@/lib/site";

export function Assurances() {
  return (
    <section className="border-y border-sand-50/10 bg-olive">
      <div className="shell grid gap-x-12 gap-y-12 py-16 sm:grid-cols-2 md:py-20 lg:grid-cols-4">
        {assurances.map((a, i) => (
          <div key={a.title}>
            <p className="text-[10px] tracking-[0.28em] text-brass-light/70">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-4 font-display text-xl font-light text-sand-50">
              {a.title}
            </h3>
            <p className="mt-3 max-w-xs text-[13px] leading-[1.8] text-muted-light">
              {a.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
