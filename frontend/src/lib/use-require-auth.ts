"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, type UserRole } from "@/store/auth-store";
import { useMounted } from "@/lib/use-mounted";

/**
 * Guard de rota client-side: redireciona pra /login se não houver sessão, ou
 * pra "/" se a sessão existir mas não tiver o `role` exigido.
 *
 * Isto é proteção de UX, não de segurança — não substitui a autorização real
 * que o backend faz (JWT Authorizer + `requireAdmin()`, ver
 * `havoc-documentacao-tecnica.md` seção 4). Mesmo com este guard, toda
 * chamada de API precisa ser validada de novo no servidor.
 *
 * Retorna `{ ready: boolean }` — só renderize o conteúdo protegido quando
 * `ready` for `true`, pra não piscar a tela antes do redirect acontecer.
 */
export function useRequireAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace("/");
    }
  }, [mounted, user, requiredRole, router, pathname]);

  const ready = mounted && !!user && (!requiredRole || user.role === requiredRole);
  return { ready };
}
