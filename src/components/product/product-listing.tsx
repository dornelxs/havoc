"use client";

import { useState } from "react";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import type { Product } from "@/types/product";

export function ProductListing({ products }: { products: Product[] }) {
  const [filtered, setFiltered] = useState(products);

  return (
    <>
      <ProductFilters products={products} onChange={setFiltered} />
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} produtos</p>
      <ProductGrid products={filtered} />
    </>
  );
}
