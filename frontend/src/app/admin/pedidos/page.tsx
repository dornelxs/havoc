import { ShoppingBag } from "lucide-react";

export default function AdminPedidosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fila de pedidos por status, detalhe com itens e rastreio por item.
        </p>
      </div>

      <div className="border border-dashed border-border p-8 flex flex-col items-center text-center gap-3">
        <ShoppingBag className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-md">
          Nenhum endpoint admin de pedidos existe ainda no backend. Hoje só há{" "}
          <code>GET /orders/mine</code> (pedidos do próprio cliente) e{" "}
          <code>POST /orders/checkout</code>. Falta <code>GET /admin/orders</code>{" "}
          (listar todos, filtrar por status) e <code>PATCH /admin/orders/{"{id}"}</code>{" "}
          (mudar status, adicionar rastreio por item) — ver roadmap na seção 11 de{" "}
          <code>havoc-documentacao-tecnica.md</code>.
        </p>
      </div>
    </div>
  );
}
