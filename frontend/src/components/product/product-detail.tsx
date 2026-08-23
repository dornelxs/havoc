"use client";

import { useMemo, useState } from "react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import type { Product } from "@/types/product";

export function ProductDetail({ product }: { product: Product }) {
  const [colorId, setColorId] = useState(product.colorways[0].id);

  const colorway = useMemo(
    () => product.colorways.find((c) => c.id === colorId) ?? product.colorways[0],
    [product, colorId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <ProductGallery images={colorway.images} alt={product.name} />
      <ProductBuyBox product={product} colorId={colorId} onColorChange={setColorId} />
    </div>
  );
}
