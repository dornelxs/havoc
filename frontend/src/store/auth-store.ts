"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "customer" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signup: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

/**
 * MOCK DE AUTENTICAÇÃO — TEMPORÁRIO.
 *
 * Isto NÃO é autenticação real. Não há verificação de senha de verdade, não
 * há JWT, não há chamada ao Cognito. Existe só pra destravar o
 * desenvolvimento das telas (login, checkout exigindo sessão, painel admin)
 * antes de `Havoc-Auth` (backend/infra/lib/auth-stack.ts) estar deployado.
 *
 * Quando o User Pool do Cognito existir de verdade, substituir este arquivo
 * inteiro por uma integração real via `amazon-cognito-identity-js` — ver
 * `havoc-documentacao-tecnica.md` seção 7 para o fluxo esperado (signup
 * público vira `customer`; `admin` nunca nasce de um cadastro, só via
 * `backend/api/scripts/provision-admin.ts`). Nenhuma senha real deve ser
 * usada com este mock — é só um cadastro em localStorage, texto plano.
 */
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@havoc.com": {
    password: "admin123",
    user: { id: "mock-admin-1", email: "admin@havoc.com", fullName: "Admin Havoc", role: "admin" },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: async (email, password) => {
        await new Promise((r) => setTimeout(r, 300)); // simula latência de rede

        const record = MOCK_USERS[email.toLowerCase()];
        if (!record || record.password !== password) {
          return { ok: false, error: "E-mail ou senha inválidos." };
        }

        set({ user: record.user });
        return { ok: true };
      },

      signup: async (email, password, fullName) => {
        await new Promise((r) => setTimeout(r, 300));

        const key = email.toLowerCase();
        if (MOCK_USERS[key]) {
          return { ok: false, error: "Já existe uma conta com este e-mail." };
        }

        // Cadastro público sempre nasce "customer" — nunca aceitar um role
        // vindo de fora, nem neste mock (mesma regra do backend real, ver
        // seção 7 da doc técnica).
        const user: AuthUser = {
          id: `mock-${Date.now()}`,
          email: key,
          fullName,
          role: "customer",
        };
        MOCK_USERS[key] = { password, user };

        set({ user });
        return { ok: true };
      },

      logout: () => set({ user: null }),
    }),
    { name: "havoc-auth-mock" }
  )
);
