"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/product-form";
import { useProductStore } from "@/store/product-store";
import type { Product } from "@/types/product";

export default function NovoProdutoPage() {
  const router = useRouter();
  const createProduct = useProductStore((s) => s.create);
  const products = useProductStore((s) => s.products);

  function handleSubmit(product: Product) {
    if (products.some((p) => p.slug === product.slug)) {
      toast.error("Já existe um produto com este slug.");
      return;
    }
    createProduct(product);
    toast.success(`${product.name} cadastrado.`);
    router.push("/admin/produtos");
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight mb-1">Novo Produto</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Cadastro salvo no catálogo administrável (local). A loja pública ainda lê o
        catálogo mock original — ver <code>DECISIONS.md</code> para o plano de unificação.
      </p>
      <ProductForm onSubmit={handleSubmit} submitLabel="Cadastrar Produto" />
    </div>
  );
}
