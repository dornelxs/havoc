"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify, emptyColorway } from "@/store/product-store";
import type {
  Product,
  ProductCategory,
  ProductColorway,
  ProductGender,
} from "@/types/product";

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "tenis", label: "Tênis" },
  { value: "oculos", label: "Óculos" },
  { value: "relogios", label: "Relógios" },
  { value: "roupas-academia", label: "Roupas de Academia" },
];

const GENDERS: { value: ProductGender; label: string }[] = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "unissex", label: "Unissex" },
  { value: "infantil", label: "Infantil" },
];

function emptyProduct(): Product {
  return {
    id: crypto.randomUUID(),
    slug: "",
    name: "",
    subtitle: "",
    brand: "Havoc",
    category: "tenis",
    gender: "unissex",
    price: 0,
    currency: "BRL",
    description: "",
    features: [],
    tags: [],
    isNew: false,
    isBestSeller: false,
    colorways: [emptyColorway()],
  };
}

interface ProductFormProps {
  initialProduct?: Product;
  onSubmit: (product: Product) => void;
  submitLabel: string;
}

export function ProductForm({ initialProduct, onSubmit, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(initialProduct ?? emptyProduct());
  const [slugTouched, setSlugTouched] = useState(!!initialProduct);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((p) => ({ ...p, [key]: value }));
  }

  function handleNameChange(name: string) {
    updateField("name", name);
    if (!slugTouched) {
      updateField("slug", slugify(name));
    }
  }

  function updateColorway(index: number, patch: Partial<ProductColorway>) {
    setProduct((p) => ({
      ...p,
      colorways: p.colorways.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function addColorway() {
    setProduct((p) => ({ ...p, colorways: [...p.colorways, emptyColorway()] }));
  }

  function removeColorway(index: number) {
    setProduct((p) => ({
      ...p,
      colorways: p.colorways.filter((_, i) => i !== index),
    }));
  }

  function addSize(colorwayIndex: number) {
    setProduct((p) => ({
      ...p,
      colorways: p.colorways.map((c, i) =>
        i === colorwayIndex ? { ...c, sizes: [...c.sizes, { size: "", inStock: true }] } : c
      ),
    }));
  }

  function updateSize(colorwayIndex: number, sizeIndex: number, patch: Partial<{ size: string; inStock: boolean }>) {
    setProduct((p) => ({
      ...p,
      colorways: p.colorways.map((c, i) =>
        i === colorwayIndex
          ? {
              ...c,
              sizes: c.sizes.map((s, si) => (si === sizeIndex ? { ...s, ...patch } : s)),
            }
          : c
      ),
    }));
  }

  function removeSize(colorwayIndex: number, sizeIndex: number) {
    setProduct((p) => ({
      ...p,
      colorways: p.colorways.map((c, i) =>
        i === colorwayIndex ? { ...c, sizes: c.sizes.filter((_, si) => si !== sizeIndex) } : c
      ),
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!product.slug) {
      setError("Slug é obrigatório.");
      return;
    }
    if (product.colorways.length === 0) {
      setError("Cadastre pelo menos uma cor.");
      return;
    }
    if (product.colorways.some((c) => !c.colorName || c.sizes.length === 0)) {
      setError("Toda cor precisa de um nome e pelo menos um tamanho.");
      return;
    }

    onSubmit(product);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Dados básicos */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Dados do Produto
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              value={product.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="rounded-none h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              required
              value={product.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField("slug", e.target.value);
              }}
              className="rounded-none h-10 font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={product.subtitle ?? ""}
              onChange={(e) => updateField("subtitle", e.target.value)}
              className="rounded-none h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              value={product.category}
              onChange={(e) => updateField("category", e.target.value as ProductCategory)}
              className="w-full h-10 rounded-none border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender">Gênero</Label>
            <select
              id="gender"
              value={product.gender}
              onChange={(e) => updateField("gender", e.target.value as ProductGender)}
              className="w-full h-10 rounded-none border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={product.price || ""}
              onChange={(e) => updateField("price", Number(e.target.value))}
              className="rounded-none h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="compareAtPrice">Preço comparativo (opcional)</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              value={product.compareAtPrice ?? ""}
              onChange={(e) =>
                updateField(
                  "compareAtPrice",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="rounded-none h-10"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={4}
              value={product.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-none border border-input bg-transparent px-2.5 py-2 text-sm dark:bg-input/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isNew"
              type="checkbox"
              checked={!!product.isNew}
              onChange={(e) => updateField("isNew", e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="isNew" className="cursor-pointer">
              Marcar como novidade
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isBestSeller"
              type="checkbox"
              checked={!!product.isBestSeller}
              onChange={(e) => updateField("isBestSeller", e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="isBestSeller" className="cursor-pointer">
              Marcar como mais vendido
            </Label>
          </div>
        </div>
      </section>

      {/* Cores e tamanhos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Cores e Tamanhos
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none font-mono text-xs uppercase tracking-[0.1em] gap-1.5"
            onClick={addColorway}
          >
            <Plus className="size-3.5" />
            Cor
          </Button>
        </div>

        {product.colorways.map((colorway, colorwayIndex) => (
          <div key={colorway.id} className="border border-border p-4 space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1">
                <Label>Nome da cor</Label>
                <Input
                  required
                  value={colorway.colorName}
                  onChange={(e) =>
                    updateColorway(colorwayIndex, { colorName: e.target.value })
                  }
                  className="rounded-none h-9"
                  placeholder="Ex: Preto"
                />
              </div>
              <div className="space-y-1.5 w-24">
                <Label>Cor (hex)</Label>
                <Input
                  type="color"
                  value={colorway.colorHex}
                  onChange={(e) =>
                    updateColorway(colorwayIndex, { colorHex: e.target.value })
                  }
                  className="rounded-none h-9 p-1"
                />
              </div>
              {product.colorways.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover cor"
                  className="text-destructive shrink-0"
                  onClick={() => removeColorway(colorwayIndex)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tamanhos</Label>
              {colorway.sizes.map((size, sizeIndex) => (
                <div key={sizeIndex} className="flex items-center gap-2">
                  <Input
                    required
                    value={size.size}
                    onChange={(e) =>
                      updateSize(colorwayIndex, sizeIndex, { size: e.target.value })
                    }
                    className="rounded-none h-9 w-24"
                    placeholder="Ex: 40"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={size.inStock}
                      onChange={(e) =>
                        updateSize(colorwayIndex, sizeIndex, { inStock: e.target.checked })
                      }
                      className="size-3.5"
                    />
                    Disponível
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover tamanho"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeSize(colorwayIndex, sizeIndex)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none font-mono text-xs uppercase tracking-[0.1em] gap-1.5"
                onClick={() => addSize(colorwayIndex)}
              >
                <Plus className="size-3.5" />
                Tamanho
              </Button>
            </div>
          </div>
        ))}
      </section>

      {error && (
        <p className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          size="lg"
          className="rounded-none font-mono uppercase tracking-[0.15em]"
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-none font-mono uppercase tracking-[0.15em]"
          onClick={() => router.push("/admin/produtos")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
