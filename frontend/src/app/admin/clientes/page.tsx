import { Users } from "lucide-react";

export default function AdminClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only: histórico de pedidos por cliente, para suporte.
        </p>
      </div>

      <div className="border border-dashed border-border p-8 flex flex-col items-center text-center gap-3">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-md">
          Nenhum endpoint admin de clientes existe ainda no backend. A tabela{" "}
          <code>customers</code> já existe no schema (<code>backend/api/src/db/schema.ts</code>),
          falta um <code>GET /admin/customers</code> read-only pra esta tela consumir.
        </p>
      </div>
    </div>
  );
}
