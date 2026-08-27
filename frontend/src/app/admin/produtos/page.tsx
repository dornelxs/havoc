import { getAllProducts } from "@/data/products";
import { formatPrice } from "@/lib/format";

/**
 * Fonte de dados: catálogo mock do frontend (`src/data/products.ts`) — o
 * MESMO usado pela loja pública. Não é a API admin real
 * (`GET /admin/products`, que já existe no backend e devolve `costPrice` +
 * margem calculada). Trocar por `fetch` contra a API assim que `Havoc-Api`
 * estiver deployado — ver `backend/README.md`.
 */
export default function AdminProdutosPage() {
  const products = getAllProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exibindo catálogo mock ({products.length} produtos) — ainda não conectado à API.
          </p>
        </div>
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
              <th className="text-left px-4 py-3">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
