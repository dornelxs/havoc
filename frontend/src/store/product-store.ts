"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products as seedProducts } from "@/data/products";
import type { Product, ProductColorway } from "@/types/product";

/**
 * "BANCO" DE PRODUTOS EDITÁVEL PELO ADMIN — TEMPORÁRIO (client-side, mock).
 *
 * Enquanto a API real (`backend/api/src/handlers/admin/products/*`) não
 * está deployada, este store é a única fonte de verdade que o painel admin
 * pode de fato criar/editar/excluir — persistido em localStorage
 * (`havoc-products-admin`).
 *
 * Seedado com o catálogo mock original (`src/data/products.ts`) só para não
 * começar com a loja vazia nesta fase de desenvolvimento. Conceitualmente,
 * a regra é: **um produto só existe pra loja pública se o admin o
 * cadastrou** — quando a API real existir, a loja deixa de ler
 * `src/data/products.ts` e passa a consultar o backend, que não tem nenhum
 * produto além do que for cadastrado por `POST /admin/products`. Este store
 * é a ponte local até lá; a loja pública (`getAllProducts()` em
 * `src/data/products.ts`) continua intocada por ora — só o painel admin lê
 * e escreve aqui.
 */
interface ProductStoreState {
  products: Product[];
  getById: (id: string) => Product | undefined;
  create: (product: Product) => void;
  update: (id: string, product: Product) => void;
  remove: (id: string) => void;
}

export const useProductStore = create<ProductStoreState>()(
  persist(
    (set, get) => ({
      products: seedProducts,

      getById: (id) => get().products.find((p) => p.id === id),

      create: (product) =>
        set((state) => ({ products: [...state.products, product] })),

      update: (id, product) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? product : p)),
        })),

      remove: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
    }),
    { name: "havoc-products-admin" }
  )
);

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (diacríticos combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function emptyColorway(): ProductColorway {
  return {
    id: crypto.randomUUID(),
    colorName: "",
    colorHex: "#111111",
    images: [],
    sizes: [],
  };
}
