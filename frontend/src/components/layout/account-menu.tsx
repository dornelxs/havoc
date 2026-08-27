"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { useMounted } from "@/lib/use-mounted";

export function AccountMenu() {
  const mounted = useMounted();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    toast.success("Você saiu da sua conta.");
    router.push("/");
  }

  // Antes de montar (hydration), ou sem usuário: link direto pra login —
  // evita mismatch de SSR/localStorage (mesmo padrão do WishlistButton).
  if (!mounted || !user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Entrar"
        className="hidden sm:inline-flex"
        render={<Link href="/login" />}
      >
        <User className="size-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Minha conta" className="hidden sm:inline-flex" />
        }
      >
        <User className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-none">
        <div className="px-1.5 py-1.5 font-mono text-xs uppercase tracking-[0.1em]">
          {user.fullName}
          <span className="block text-muted-foreground normal-case font-sans text-xs mt-0.5">
            {user.email}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/minha-conta/pedidos" />} className="gap-2">
          <Package className="size-4" />
          Meus Pedidos
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem render={<Link href="/admin" />} className="gap-2">
            <LayoutDashboard className="size-4" />
            Painel Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
