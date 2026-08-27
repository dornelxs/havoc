"use client";

import { Package } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function MeusPedidosPage() {
  const { ready } = useRequireAuth();

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Verificando acesso...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl uppercase tracking-tight mb-1">Meus Pedidos</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Histórico de compras da sua conta.
      </p>

      <div className="border border-dashed border-border p-8 flex flex-col items-center text-center gap-3">
        <Package className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-md">
          Esta tela ainda não está conectada à API. O backend já expõe{" "}
          <code>GET /orders/mine</code> (ver <code>backend/README.md</code>) — falta só
          implementar o fetch aqui, usando o token de sessão real assim que a
          autenticação com Cognito substituir o mock atual.
        </p>
      </div>
    </div>
  );
}
