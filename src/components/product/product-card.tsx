import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "@/components/product/wishlist-button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const mainColor = product.colorways[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        <Image
          src={mainColor.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <Badge className="rounded-none font-mono text-[10px] uppercase tracking-[0.1em]">
              Novo
            </Badge>
          )}
          {hasDiscount && (
            <Badge
              variant="destructive"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.1em]"
            >
              Oferta
            </Badge>
          )}
        </div>
        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute top-3 right-3"
        />
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium leading-tight text-foreground/90">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.subtitle}</p>
        {product.colorways.length > 1 && (
          <p className="text-xs text-muted-foreground pt-0.5">
            {product.colorways.length} cores
          </p>
        )}
      </div>
    </Link>
  );
}
