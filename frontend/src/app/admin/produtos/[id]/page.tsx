"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/product-form";
import { useMounted } from "@/lib/use-mounted";
import { useProductStore } from "@/store/product-store";
import type { Product } from "@/types/product";

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mounted = useMounted();
  const products = useProductStore((s) => s.products);
  const updateProduct = useProductStore((s) => s.update);
  const product = products.find((p) => p.id === params.id);

  function handleSubmit(updated: Product) {
    const slugClash = products.some((p) => p.id !== params.id && p.slug === updated.slug);
    if (slugClash) {
      toast.error("Já existe outro produto com este slug.");
      return;
    }
    updateProduct(params.id, updated);
    toast.success(`${updated.name} atualizado.`);
    router.push("/admin/produtos");
  }

  if (!mounted) return null;

  if (!product) {
    return (
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight mb-1">
          Produto não encontrado
        </h1>
        <p className="text-sm text-muted-foreground">
          Este produto pode ter sido removido.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight mb-1">Editar Produto</h1>
      <p className="text-sm text-muted-foreground mb-8">{product.name}</p>
      <ProductForm
        initialProduct={product}
        onSubmit={handleSubmit}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}
