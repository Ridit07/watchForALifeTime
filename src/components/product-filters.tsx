"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { FACETS, SORT_OPTIONS, PAGE_SIZE } from "@/lib/filters";
import { cx, titleCase } from "@/lib/utils";
import { CloseIcon } from "./icons";

/**
 * Filters write to the URL rather than local state, so a narrowed view can
 * be linked and the server does the filtering. Every change resets `show`,
 * otherwise a visitor who had loaded 100 pieces would re-request 100 of a
 * much smaller result.
 */
export function ProductFilters({
  vendors,
  facetOptions,
  total,
  active,
}: {
  vendors: string[];
  /** Values actually present in the catalogue, keyed by facet param. */
  facetOptions: Record<string, string[]>;
  total: number;
  active: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const selectedBrands = (params.get("brand") ?? "")
    .split(",")
    .filter(Boolean);

  const push = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("show");
    startTransition(() => {
      router.push(next.toString() ? `?${next}` : "?", { scroll: false });
    });
  };

  /** Multi-select toggle shared by brand and every metafield facet. */
  const toggle = (key: string, value: string) =>
    push((p) => {
      const current = (p.get(key) ?? "").split(",").filter(Boolean);
      const set = new Set(current);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size) p.set(key, [...set].join(","));
      else p.delete(key);
    });

  const setParam = (key: string, value: string) =>
    push((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  const clear = () =>
    startTransition(() => {
      const next = new URLSearchParams();
      const sort = params.get("sort");
      if (sort) next.set("sort", sort);
      router.push(next.toString() ? `?${next}` : "?", { scroll: false });
    });

  const inStock = params.get("stock") === "in";

  return (
    <div className={cx("transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-5 border-b border-sand-50/10 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-xs tracking-[0.15em] text-sand-50 uppercase underline underline-offset-4 lg:hidden"
          >
            {open ? "Hide filters" : "Filters"}
          </button>
          <p className="text-xs tracking-[0.15em] text-muted-light uppercase">
            {total} {total === 1 ? "piece" : "pieces"}
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs tracking-[0.15em] text-muted-light uppercase">
          Sort
          <select
            value={params.get("sort") ?? "featured"}
            onChange={(e) => setParam("sort", e.target.value)}
            className="border border-sand-50/20 bg-ink-soft px-3.5 py-2 text-xs tracking-normal text-sand-50 normal-case focus:border-brass focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={cx("lg:block", open ? "block" : "hidden")}>
        <div className="flex flex-wrap items-start gap-x-14 gap-y-9 py-10">
          {vendors.length > 1 && (
            <fieldset>
              <legend className="eyebrow mb-4">Brand</legend>
              <div className="flex flex-wrap gap-2">
                {vendors.map((v) => {
                  const on = selectedBrands.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggle("brand", v)}
                      aria-pressed={on}
                      className={cx(
                        "border px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors",
                        on
                          ? "border-sand-50 bg-sand-50 text-olive"
                          : "border-sand-50/20 text-sand-200 hover:border-sand-50 hover:text-sand-50",
                      )}
                    >
                      {titleCase(v)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {FACETS.map((facet) => {
            const values = facetOptions[facet.param] ?? [];
            if (values.length < 2) return null;

            const selected = (params.get(facet.param) ?? "")
              .split(",")
              .filter(Boolean)
              .map((v) => v.toLowerCase());

            return (
              <fieldset key={facet.param}>
                <legend className="eyebrow mb-4">{facet.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {values.map((v) => {
                    const on = selected.includes(v.toLowerCase());
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggle(facet.param, v)}
                        aria-pressed={on}
                        className={cx(
                          "border px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors",
                          on
                            ? "border-sand-50 bg-sand-50 text-olive"
                            : "border-sand-50/20 text-sand-200 hover:border-sand-50 hover:text-sand-50",
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <fieldset>
            <legend className="eyebrow mb-4">Price</legend>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Min"
                defaultValue={params.get("min") ?? ""}
                onBlur={(e) => setParam("min", e.target.value)}
                className="w-24 border border-sand-50/20 bg-ink-soft px-3.5 py-2 text-sm text-sand-50 focus:border-brass focus:outline-none"
              />
              <span aria-hidden className="text-muted-light">
                –
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Max"
                defaultValue={params.get("max") ?? ""}
                onBlur={(e) => setParam("max", e.target.value)}
                className="w-24 border border-sand-50/20 bg-ink-soft px-3.5 py-2 text-sm text-sand-50 focus:border-brass focus:outline-none"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">Availability</legend>
            <button
              type="button"
              onClick={() => setParam("stock", inStock ? "" : "in")}
              aria-pressed={inStock}
              className={cx(
                "border px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors",
                inStock
                  ? "border-sand-50 bg-sand-50 text-olive"
                  : "border-sand-50/20 text-sand-200 hover:border-sand-50 hover:text-sand-50",
              )}
            >
              In stock only
            </button>
          </fieldset>

          {active && (
            <button
              type="button"
              onClick={clear}
              className="mt-7 flex items-center gap-1.5 text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
            >
              <CloseIcon />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Grows the page size in the URL; the server refetches with a larger `first`. */
export function LoadMore({ shown, hasMore }: { shown: number; hasMore: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (!hasMore) return null;

  const more = () => {
    const next = new URLSearchParams(params.toString());
    next.set("show", String(shown + PAGE_SIZE));
    startTransition(() => {
      router.push(`?${next}`, { scroll: false });
    });
  };

  return (
    <div className="mt-20 text-center">
      <button
        type="button"
        onClick={more}
        disabled={pending}
        className="btn btn-outline disabled:opacity-50"
      >
        {pending ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
