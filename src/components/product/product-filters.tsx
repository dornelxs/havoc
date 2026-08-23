"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export type SortOption = "relevancia" | "menor-preco" | "maior-preco" | "novidades";

interface ProductFiltersProps {
  products: Product[];
  onChange: (filtered: Product[]) => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  relevancia: "Relevância",
  "menor-preco": "Preço menor-maior",
  "maior-preco": "Preço maior-menor",
  novidades: "Mais recentes",
};

export function ProductFilters({ products, onChange }: ProductFiltersProps) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevancia");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) =>
      p.colorways.forEach((c) => map.set(c.colorName, c.colorHex))
    );
    return Array.from(map.entries());
  }, [products]);

  function toggleColor(colorName: string) {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  }

  function apply(sortValue: SortOption, colors: string[]) {
    let result = [...products];

    if (colors.length > 0) {
      result = result.filter((p) => p.colorways.some((c) => colors.includes(c.colorName)));
    }

    switch (sortValue) {
      case "menor-preco":
        result.sort((a, b) => a.price - b.price);
        break;
      case "maior-preco":
        result.sort((a, b) => b.price - a.price);
        break;
      case "novidades":
        result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
    }

    onChange(result);
  }

  function handleSortChange(value: SortOption) {
    setSort(value);
    apply(value, selectedColors);
  }

  function handleColorToggle(colorName: string) {
    toggleColor(colorName);
    const next = selectedColors.includes(colorName)
      ? selectedColors.filter((c) => c !== colorName)
      : [...selectedColors, colorName];
    apply(sort, next);
  }

  function clearAll() {
    setSort("relevancia");
    setSelectedColors([]);
    onChange(products);
  }

  const activeCount = selectedColors.length + (sort !== "relevancia" ? 1 : 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedColors.map((c) => (
            <Badge
              key={c}
              variant="secondary"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.1em] pl-3 pr-1.5 gap-1 cursor-pointer"
              onClick={() => handleColorToggle(c)}
            >
              {c}
              <X className="size-3" />
            </Badge>
          ))}
          {sort !== "relevancia" && (
            <Badge
              variant="secondary"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.1em] pl-3 pr-1.5 gap-1 cursor-pointer"
              onClick={() => handleSortChange("relevancia")}
            >
              {SORT_LABELS[sort]}
              <X className="size-3" />
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          className="rounded-none font-mono text-xs uppercase tracking-[0.1em] gap-2 ml-auto"
          onClick={() => setOpen(true)}
        >
          Filtrar e Organizar
          <SlidersHorizontal className="size-4" />
          {activeCount > 0 && (
            <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white text-xs">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="border-b border-border flex-row items-center justify-between pr-12">
            <SheetTitle className="font-display uppercase">Filtrar e Organizar</SheetTitle>
            <button onClick={clearAll} className="font-mono text-xs uppercase tracking-[0.1em] underline">
              Limpar tudo
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Ordenar por
              </h3>
              <div className="space-y-2">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSortChange(opt)}
                    className="flex items-center gap-2 text-sm w-full text-left"
                  >
                    <span
                      className={cn(
                        "size-4 rounded-full border flex items-center justify-center",
                        sort === opt ? "border-primary" : "border-border"
                      )}
                    >
                      {sort === opt && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Cor
              </h3>
              <div className="flex flex-wrap gap-2">
                {allColors.map(([name, hex]) => (
                  <button
                    key={name}
                    onClick={() => handleColorToggle(name)}
                    className={cn(
                      "flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em]",
                      selectedColors.includes(name)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    <span
                      className="size-3 rounded-full border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border">
            <Button
              className="w-full rounded-none font-mono uppercase tracking-[0.15em]"
              onClick={() => setOpen(false)}
            >
              Mostrar Itens
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
