"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { getAllProducts } from "@/data/products";
import type { ProductCategory } from "@/types/product";

const TABS: { label: string; value: ProductCategory }[] = [
  { label: "Tênis", value: "tenis" },
  { label: "Roupas de Academia", value: "roupas-academia" },
  { label: "Óculos", value: "oculos" },
  { label: "Relógios", value: "relogios" },
];

export function ProductTabsSection() {
  const [active, setActive] = useState<ProductCategory>("tenis");
  const products = getAllProducts()
    .filter((p) => p.category === active)
    .slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={cn(
                "px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] border transition-colors",
                active === tab.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          variant="link"
          className="font-semibold"
          render={<Link href={`/categoria/${active}`}>Ver mais</Link>}
        />
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
