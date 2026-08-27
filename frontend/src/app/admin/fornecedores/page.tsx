import { Truck } from "lucide-react";

export default function AdminFornecedoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">Fornecedores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastro: nome, contato, portal de pedido, prazo médio, política de devolução.
        </p>
      </div>

      <div className="border border-dashed border-border p-8 flex flex-col items-center text-center gap-3">
        <Truck className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-md">
          Esta tela ainda não está conectada à API. O backend já expõe{" "}
          <code>GET /admin/suppliers</code> e{" "}
          <code>POST/PUT /admin/suppliers</code> (ver <code>backend/README.md</code>) —
          falta só implementar o fetch e o formulário de cadastro aqui.
        </p>
      </div>
    </div>
  );
}
