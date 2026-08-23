import Link from "next/link";
import { HeroBanner } from "@/components/home/hero-banner";
import { CategoryStrip } from "@/components/home/category-strip";
import { OutfitInspiration } from "@/components/home/outfit-inspiration";
import { ShopByAudience } from "@/components/home/shop-by-audience";
import { ProductTabsSection } from "@/components/home/product-tabs-section";
import { EditorialBanners } from "@/components/home/editorial-banners";
import { FeatureStrip } from "@/components/home/feature-strip";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getBestSellers, getNewArrivals } from "@/data/products";

export default function Home() {
  const newArrivals = getNewArrivals();
  const bestSellers = getBestSellers();

  return (
    <>
      <HeroBanner />
      <CategoryStrip />
      <OutfitInspiration />
      <ShopByAudience />
      <ProductTabsSection />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-xl uppercase tracking-tight">Novidades</h2>
          <Button
            variant="link"
            className="font-semibold"
            render={<Link href="/novidades">Ver tudo</Link>}
          />
        </div>
        <ProductGrid products={newArrivals} />
      </section>

      <EditorialBanners />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-xl uppercase tracking-tight">Mais Vendidos</h2>
          <Button
            variant="link"
            className="font-semibold"
            render={<Link href="/categoria/tenis">Ver tudo</Link>}
          />
        </div>
        <ProductGrid products={bestSellers} />
      </section>

      <FeatureStrip />
    </>
  );
}
