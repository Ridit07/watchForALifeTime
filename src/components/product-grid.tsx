import type { Product } from "@/lib/shopify/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  priorityCount = 4,
}: {
  products: Product[];
  priorityCount?: number;
}) {
  if (!products.length) {
    return (
      <p className="py-20 text-center text-sm text-muted-light">
        No pieces here just yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
