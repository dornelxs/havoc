"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Truck, Users } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth("admin");
  const pathname = usePathname();

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="font-mono text-xs text-destructive uppercase tracking-[0.25em] mb-4">
          Painel Admin
        </p>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.1em] whitespace-nowrap transition-colors border-l-2",
                  isActive
                    ? "border-destructive bg-secondary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
