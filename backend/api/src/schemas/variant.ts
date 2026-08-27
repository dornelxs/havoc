import { z } from "zod";

const priceString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "preço deve ser um número decimal com até 2 casas");

/**
 * Allowlist explícita pra criação/atualização de variant (cor+tamanho) pelo
 * admin. Diferente do schema de produto público (schemas/product.ts), este
 * inclui `costPrice` deliberadamente — é o único lugar da aplicação onde
 * esse campo deve ser aceito de um payload, e só porque o handler que o usa
 * exige `role === "admin"` antes de sequer olhar pro corpo da requisição.
 */
export const upsertVariantSchema = z.object({
  productId: z.string().uuid(),
  colorName: z.string().min(1).max(100),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "colorHex deve ser um hex de 6 dígitos, ex: #111111"),
  size: z.string().min(1).max(20),
  price: priceString,
  compareAtPrice: priceString.optional(),
  costPrice: priceString,
  inStock: z.boolean().default(true),
  images: z.array(z.string().url().or(z.string().startsWith("/"))).max(10).default([]),
});

export type UpsertVariantInput = z.infer<typeof upsertVariantSchema>;
