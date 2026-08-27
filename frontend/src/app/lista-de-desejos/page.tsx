"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { getAllProducts } from "@/data/products";
import { useWishlistStore } from "@/store/wishlist-store";
import { useMounted } from "@/lib/use-mounted";

export default function WishlistPage() {
  const mounted = useMounted();
  const productIds = useWishlistStore((s) => s.productIds);

  const products = getAllProducts().filter((p) => productIds.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl uppercase tracking-tight mb-1">Minha Lista de Desejos</h1>
      <p className="text-muted-foreground mb-6">
        {mounted ? products.length : 0} produto{products.length === 1 ? "" : "s"}
      </p>

      {!mounted || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground max-w-sm">
            Você ainda não salvou nenhum item na sua lista de desejos. Comece a comprar e adicione
            seus produtos favoritos.
          </p>
          <Button
            className="rounded-none font-mono uppercase tracking-[0.15em]"
            render={<Link href="/">Continuar comprando</Link>}
          />
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
