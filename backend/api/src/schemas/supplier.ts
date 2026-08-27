import { z } from "zod";

/** Allowlist explícita pra criação/atualização de fornecedor pelo admin. */
export const upsertSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactInfo: z.string().max(500).optional(),
});

export type UpsertSupplierInput = z.infer<typeof upsertSupplierSchema>;
