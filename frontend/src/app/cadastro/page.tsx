"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";

export default function CadastroPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const result = await signup(email, password, fullName);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success("Conta criada com sucesso.");
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <p className="font-mono text-xs text-destructive uppercase tracking-[0.25em] mb-2">
        Havoc
      </p>
      <h1 className="font-display text-3xl uppercase tracking-tight mb-1">Criar Conta</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Ambiente de demonstração — cadastro mockado, sem autenticação real ainda.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="font-mono text-xs uppercase tracking-[0.1em]">
            Nome completo
          </Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-none h-11"
            placeholder="Seu nome"
          />
        </div>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-none h-11"
            placeholder="Mínimo 8 caracteres"
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
          {loading ? "Criando conta..." : "Criar Conta"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Já tem conta?{" "}
        <Link href="/login" className="underline font-semibold text-foreground">
          Entrar
        </Link>
      </p>
    </div>
  );
}
