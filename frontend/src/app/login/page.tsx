"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success("Login realizado.");
    const redirectTo = searchParams.get("redirect") ?? "/";
    router.push(redirectTo);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="font-mono text-xs uppercase tracking-[0.1em]">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-none h-11"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-mono text-xs uppercase tracking-[0.1em]">
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-none h-11"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full rounded-none font-mono uppercase tracking-[0.15em]"
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <p className="font-mono text-xs text-destructive uppercase tracking-[0.25em] mb-2">
        Havoc
      </p>
      <h1 className="font-display text-3xl uppercase tracking-tight mb-1">Entrar</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Ambiente de demonstração — login mockado, sem autenticação real ainda.
      </p>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Não tem conta?{" "}
        <Link href="/cadastro" className="underline font-semibold text-foreground">
          Cadastre-se
        </Link>
      </p>

      <p className="text-xs text-muted-foreground mt-8 border-t border-border pt-4">
        Conta de teste (admin): <code>admin@havoc.com</code> / <code>admin123</code>
      </p>
    </div>
  );
}
