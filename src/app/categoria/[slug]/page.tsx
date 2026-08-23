import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryPageContent } from "@/components/product/category-page-content";
import { getAllProducts } from "@/data/products";
import type { ProductCategory, ProductGender } from "@/types/product";

export const CATEGORY_LABELS: Record<string, string> = {
  tenis: "Tênis",
  oculos: "Óculos",
  relogios: "Relógios",
  "roupas-academia": "Roupas de Academia",
  masculino: "Masculino",
  feminino: "Feminino",
  unissex: "Unissex",
  infantil: "Infantil",
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  tenis:
    "Os tênis Havoc entregam performance e estilo em qualquer terreno. Da corrida de competição ao streetwear do dia a dia, tecnologia e conforto em cada passada.",
  oculos:
    "Óculos Havoc com proteção UV400 e armações leves, pensados pra acompanhar seus treinos ao ar livre e o seu estilo fora deles.",
  relogios:
    "Relógios e smartwatches Havoc pra monitorar cada treino — cronômetro, GPS e frequência cardíaca direto no pulso.",
  "roupas-academia":
    "Roupas de academia Havoc com tecidos de secagem rápida, compressão e conforto pra treinos de qualquer intensidade.",
};

const GENDER_SLUGS: ProductGender[] = ["masculino", "feminino", "unissex", "infantil"];
export const CATEGORY_SLUGS: ProductCategory[] = ["tenis", "oculos", "relogios", "roupas-academia"];

export function generateStaticParams() {
  return [...CATEGORY_SLUGS, ...GENDER_SLUGS].map((slug) => ({ slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const isCategory = (CATEGORY_SLUGS as string[]).includes(slug);
  const isGender = (GENDER_SLUGS as string[]).includes(slug);

  if (!isCategory && !isGender) notFound();

  const all = getAllProducts();
  const baseProducts = isCategory
    ? all.filter((p) => p.category === slug)
    : all.filter((p) => p.gender === slug || p.gender === "unissex");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={null}>
        <CategoryPageContent
          slug={slug}
          products={baseProducts}
          label={CATEGORY_LABELS[slug] ?? slug}
          description={CATEGORY_DESCRIPTIONS[slug]}
        />
      </Suspense>
    </div>
  );
}
