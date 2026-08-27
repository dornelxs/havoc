"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/use-mounted";
import { useProductStore } from "@/store/product-store";
import { formatPrice } from "@/lib/format";

/**
 * Fonte de dados: `useProductStore` — o "banco" de produtos editável pelo
 * admin (client-side, mock, ver `src/store/product-store.ts`). Não é a API
 * admin real (`GET /admin/products`, que já existe no backend e devolve
 * `costPrice` + margem calculada). Trocar por `fetch` contra a API assim
 * que `Havoc-Api` estiver deployado — ver `backend/README.md`.
 */
export default function AdminProdutosPage() {
  const mounted = useMounted();
  const products = useProductStore((s) => s.products);
  const removeProduct = useProductStore((s) => s.remove);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function handleDelete(id: string, name: string) {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    removeProduct(id);
    toast.success(`${name} removido do catálogo.`);
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mounted ? products.length : "..."} produtos cadastrados — só o que está aqui
            aparece na loja.
          </p>
        </div>
        <Button
          className="rounded-none font-mono uppercase tracking-[0.15em] gap-2"
          render={<Link href="/admin/produtos/novo" />}
        >
          <Plus className="size-4" />
          Novo Produto
        </Button>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border font-mono text-xs uppercase tracking-[0.05em] text-muted-foreground">
              <th className="text-left px-4 py-3">Produto</th>
              <th className="text-left px-4 py-3">Categoria</th>
              <th className="text-left px-4 py-3">Gênero</th>
              <th className="text-left px-4 py-3">Preço</th>
              <th className="text-left px-4 py-3">Cores</th>
              <th className="text-left px-4 py-3">Disponibilidade</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mounted && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum produto cadastrado. A loja não mostra nada até você cadastrar o
                  primeiro produto.
                </td>
              </tr>
            )}
            {mounted &&
              products.map((product) => {
                const totalSizes = product.colorways.reduce(
                  (sum, c) => sum + c.sizes.length,
                  0
                );
                const inStockSizes = product.colorways.reduce(
                  (sum, c) => sum + c.sizes.filter((s) => s.inStock).length,
                  0
                );

                return (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">{product.category}</td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">{product.gender}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">{product.colorways.length}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          inStockSizes === 0
                            ? "text-destructive font-semibold"
                            : inStockSizes < totalSizes
                              ? "text-amber-600 dark:text-amber-500"
                              : "text-muted-foreground"
                        }
                      >
                        {inStockSizes}/{totalSizes} tamanhos
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${product.name}`}
                          render={<Link href={`/admin/produtos/${product.id}`} />}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Excluir ${product.name}`}
                          className={
                            pendingDelete === product.id
                              ? "text-destructive"
                              : "text-muted-foreground hover:text-destructive"
                          }
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {pendingDelete === product.id && (
                        <p className="text-xs text-destructive text-right mt-1">
                          Clique de novo para confirmar
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
