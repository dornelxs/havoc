"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { cn } from "@/lib/utils";
import type { Product, ProductGender } from "@/types/product";

const GENDER_LABELS: Record<ProductGender, string> = {
  masculino: "Homem",
  feminino: "Mulher",
  unissex: "Unissex",
  infantil: "Infantil",
};

const TAG_LABELS: Record<string, string> = {
  lançamento: "Novidades",
  corrida: "Corrida",
  street: "Street",
  clássico: "Clássico",
  trilha: "Trilha",
  outdoor: "Outdoor",
  competição: "Competição",
  casual: "Casual",
  ciclismo: "Ciclismo",
  digital: "Digital",
  smartwatch: "Smartwatch",
  treino: "Treino",
};

const TAG_DESCRIPTIONS: Record<string, string> = {
  lançamento: "Os lançamentos mais recentes da Havoc, direto de fábrica pro seu treino.",
  corrida: "Feito pra quem não larga o asfalto: amortecimento e leveza pra cada quilômetro.",
  street: "Estilo de rua sem abrir mão do conforto — do treino pro dia a dia.",
  clássico: "Modelos atemporais que nunca saem de linha, com a qualidade Havoc.",
  trilha: "Aderência e proteção pra encarar qualquer terreno fora da cidade.",
  outdoor: "Resistência e performance pra treinar ao ar livre, com qualquer clima.",
  competição: "Tecnologia de ponta pra quem busca recorde pessoal em cada prova.",
  casual: "Conforto pro dia a dia, sem perder o estilo esportivo Havoc.",
  ciclismo: "Visão ampla e ventilação pensadas pra pedaladas de qualquer distância.",
  digital: "Funções completas na tela, resistência no dia a dia e no treino.",
  smartwatch: "Monitoramento completo do seu treino, direto no pulso.",
  treino: "Tecidos leves e respiráveis pra treinos de qualquer intensidade.",
};

const GENDER_DESCRIPTIONS: Record<ProductGender, string> = {
  masculino: "Seleção masculina Havoc: performance e estilo em cada peça.",
  feminino: "Seleção feminina Havoc: performance e estilo em cada peça.",
  unissex: "Seleção unissex Havoc: performance e estilo em cada peça.",
  infantil: "Seleção infantil Havoc: performance e estilo em cada peça.",
};

interface CategoryPageContentProps {
  slug: string;
  products: Product[];
  label: string;
  description?: string;
}

export function CategoryPageContent({
  slug,
  products,
  label,
  description,
}: CategoryPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const genderParam = searchParams.get("genero") as ProductGender | null;
  const activeTag = searchParams.get("tag");

  const genderFiltered = useMemo(() => {
    if (!genderParam) return products;
    return products.filter((p) => p.gender === genderParam || p.gender === "unissex");
  }, [products, genderParam]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    genderFiltered.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [genderFiltered]);

  const tagFiltered = useMemo(() => {
    if (!activeTag) return genderFiltered;
    return genderFiltered.filter((p) => p.tags?.includes(activeTag));
  }, [genderFiltered, activeTag]);

  const baseForFilters = tagFiltered;

  // `filtered` acompanha `baseForFilters` (categoria/gênero/tag mudaram) mas
  // pode ser sobrescrito pelo <ProductFilters> quando o usuário ordena ou
  // filtra por cor. Resetar via comparação durante o render — não em um
  // `useEffect` — é o padrão recomendado pelo React para "estado derivado
  // que também precisa aceitar override local": evita o render extra que um
  // efeito causaria a cada troca de categoria/gênero/tag.
  const [filtered, setFiltered] = useState<Product[]>(baseForFilters);
  const [lastBase, setLastBase] = useState(baseForFilters);
  if (baseForFilters !== lastBase) {
    setLastBase(baseForFilters);
    setFiltered(baseForFilters);
  }

  const displayed = filtered;

  // Se a tag ativa deixar de existir pro gênero selecionado (trocou de
  // gênero e a tag não bate com nenhum produto), limpa a URL — evita ficar
  // preso numa combinação sem resultado. Isto navega (efeito colateral real
  // via router), não faz setState local — por isso continua em useEffect.
  useEffect(() => {
    if (activeTag && !tags.includes(activeTag)) {
      setTag(null);
    }
    // setTag é redefinida a cada render mas só lê `searchParams`/`router`
    // (ambos já refletidos indiretamente por `activeTag`/`tags`); incluí-la
    // seria puro ruído sem mudar quando o efeito de fato precisa rodar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag, tags]);

  const activeDescription = activeTag
    ? TAG_DESCRIPTIONS[activeTag]
    : genderParam
      ? GENDER_DESCRIPTIONS[genderParam]
      : description;

  function setGender(gender: ProductGender | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (gender) {
      params.set("genero", gender);
    } else {
      params.delete("genero");
    }
    router.push(params.size ? `?${params.toString()}` : "?", { scroll: false });
  }

  function setTag(tag: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.push(params.size ? `?${params.toString()}` : "?", { scroll: false });
  }

  const breadcrumbParts = [
    { label: "Página Inicial", href: "/" },
    { label, href: `/categoria/${slug}` },
  ];

  const activeChips: { label: string; removable: boolean; onRemove?: () => void }[] = [
    { label, removable: false },
  ];
  if (activeTag) {
    activeChips.push({
      label: TAG_LABELS[activeTag] ?? activeTag,
      removable: true,
      onRemove: () => setTag(null),
    });
  }
  if (genderParam) {
    activeChips.push({
      label: GENDER_LABELS[genderParam],
      removable: true,
      onRemove: () => setGender(null),
    });
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-muted-foreground mb-6 flex-wrap">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 font-bold text-foreground hover:underline"
        >
          <ChevronLeft className="size-3" />
          Voltar
        </button>
        {breadcrumbParts.map((part, i) => (
          <span key={part.href} className="flex items-center gap-2">
            <span>/</span>
            {i === breadcrumbParts.length - 1 ? (
              <span className="text-foreground">{part.label}</span>
            ) : (
              <Link href={part.href} className="underline hover:text-foreground">
                {part.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Title + count */}
      <div className="flex items-baseline gap-3 mb-3">
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight">{label}</h1>
        <span className="font-mono text-sm text-destructive">[{genderFiltered.length}]</span>
      </div>

      {activeDescription && (
        <p className="text-sm text-muted-foreground max-w-3xl mb-6">{activeDescription}</p>
      )}

      {/* Sub-collection tabs (by tag) */}
      {tags.length > 0 && (
        <div className="flex items-center gap-6 border-b border-border mb-4 overflow-x-auto">
          <button
            onClick={() => setTag(null)}
            className={cn(
              "pb-3 font-mono text-xs uppercase tracking-[0.1em] border-b-2 whitespace-nowrap transition-colors",
              !activeTag ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Todos
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTag(tag)}
              className={cn(
                "pb-3 font-mono text-xs uppercase tracking-[0.1em] border-b-2 whitespace-nowrap transition-colors",
                activeTag === tag
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {TAG_LABELS[tag] ?? tag}
            </button>
          ))}
        </div>
      )}

      {/* Gender toggle chips + active context chips */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {activeChips.map((chip) => (
            <Badge
              key={chip.label}
              className="rounded-none bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-[0.05em] px-3 py-1.5 gap-1.5"
            >
              {chip.label}
              {chip.removable && (
                <button onClick={chip.onRemove} aria-label={`Remover filtro ${chip.label}`}>
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
          {!genderParam && (
            <>
              <button
                onClick={() => setGender("masculino")}
                className="border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] hover:border-primary transition-colors"
              >
                Homem
              </button>
              <button
                onClick={() => setGender("feminino")}
                className="border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] hover:border-primary transition-colors"
              >
                Mulher
              </button>
            </>
          )}
        </div>
      </div>

      <ProductFilters
        key={`${activeTag ?? "all"}-${genderParam ?? "all"}`}
        products={baseForFilters}
        onChange={setFiltered}
      />
      <p className="text-sm text-muted-foreground mb-4">{displayed.length} produtos</p>
      <ProductGrid products={displayed} />
    </>
  );
}
