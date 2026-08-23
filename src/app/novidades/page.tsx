import { ProductListing } from "@/components/product/product-listing";
import { getNewArrivals } from "@/data/products";

export default function NovidadesPage() {
  const products = getNewArrivals(50);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl uppercase tracking-tight mb-6">Novidades</h1>
      <ProductListing products={products} />
    </div>
  );
}
