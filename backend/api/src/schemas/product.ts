import { z } from "zod";

export const productCategorySchema = z.enum([
  "tenis",
  "oculos",
  "relogios",
  "roupas-academia",
]);

export const productGenderSchema = z.enum([
  "masculino",
  "feminino",
  "unissex",
  "infantil",
]);

/** Query params aceitos por GET /products — allowlist explícita (item 8 do checklist de segurança). */
export const listProductsQuerySchema = z.object({
  category: productCategorySchema.optional(),
  gender: productGenderSchema.optional(),
  tag: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  cursor: z.string().uuid().optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

/** Corpo aceito por POST/PUT de produto no painel admin — allowlist explícita. Nunca inclui cost_price de variant aqui; isso é tratado em schemas/variant.ts. */
export const upsertProductSchema = z.object({
  supplierId: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug deve ser kebab-case"),
  name: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  category: productCategorySchema,
  gender: productGenderSchema,
  description: z.string().max(5000).default(""),
  features: z.array(z.string().max(200)).max(20).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
});

export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
