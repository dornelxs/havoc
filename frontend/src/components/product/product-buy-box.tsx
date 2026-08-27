"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useMounted } from "@/lib/use-mounted";
import type { Product } from "@/types/product";

interface ProductBuyBoxProps {
  product: Product;
  colorId: string;
  onColorChange: (colorId: string) => void;
}

export function ProductBuyBox({ product, colorId, onColorChange }: ProductBuyBoxProps) {
  const [size, setSize] = useState<string | null>(null);
  const mounted = useMounted();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const colorway = useMemo(
    () => product.colorways.find((c) => c.id === colorId)!,
    [product, colorId]
  );

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  function handleAddToCart() {
    if (!size) {
      toast.error("Selecione um tamanho antes de continuar.");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: colorway.images[0],
      colorId: colorway.id,
      colorName: colorway.colorName,
      size,
      quantity: 1,
    });
    toast.success(`${product.name} adicionado à sacola.`);
  }

  function handleToggleWishlist() {
    toggleWishlist(product.id);
    if (!isWishlisted) {
      toast.success(`${product.name} adicionado à lista de desejos.`);
    }
  }

  const wishlisted = mounted && isWishlisted;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-destructive uppercase tracking-[0.25em]">{product.brand}</p>
        <h1 className="font-display text-2xl uppercase tracking-tight mt-1">{product.name}</h1>
        <p className="text-muted-foreground">{product.subtitle}</p>
      </div>

      {product.rating && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4",
                  i < Math.round(product.rating!) ? "fill-amber-500" : "fill-none"
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground">
            {product.rating.toFixed(1)} ({product.reviewCount} avaliações)
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        ou 10x de {formatPrice(product.price / 10)} sem juros
      </p>

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.1em] mb-2">
          Cor: <span className="text-muted-foreground normal-case">{colorway.colorName}</span>
        </p>
        <div className="flex gap-2">
          {product.colorways.map((c) => (
            <button
              key={c.id}
              aria-label={c.colorName}
              onClick={() => {
                onColorChange(c.id);
                setSize(null);
              }}
              className={cn(
                "size-10 rounded-full border-2 transition-all",
                colorId === c.id ? "border-primary scale-105" : "border-transparent hover:border-border"
              )}
              style={{ backgroundColor: c.colorHex }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.1em] mb-2">Tamanho</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {colorway.sizes.map((s) => (
            <button
              key={s.size}
              disabled={!s.inStock}
              onClick={() => setSize(s.size)}
              className={cn(
                "h-11 rounded-none border text-sm font-medium transition-colors",
                !s.inStock && "opacity-30 line-through cursor-not-allowed",
                s.inStock && size === s.size && "border-primary bg-primary text-primary-foreground",
                s.inStock && size !== s.size && "border-border hover:border-primary"
              )}
            >
              {s.size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Button
          size="lg"
          className="w-full rounded-none font-mono uppercase tracking-[0.15em]"
          onClick={handleAddToCart}
        >
          Adicionar à Sacola
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full rounded-none font-mono uppercase tracking-[0.15em] gap-2"
          onClick={handleToggleWishlist}
        >
          <Heart className={cn("size-4", wishlisted && "fill-primary text-primary")} />
          {wishlisted ? "Na Lista de Desejos" : "Favoritar"}
        </Button>
      </div>

      <div className="pt-4 space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.1em]">Descrição</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 pt-2">
          {product.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
