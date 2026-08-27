import { z } from "zod";

/**
 * Item do carrinho enviado pelo client no checkout. Client manda só
 * `variantId` + `quantity` — nunca preço. O servidor busca o preço real da
 * variant no banco e recalcula o total; qualquer preço vindo do payload é
 * ignorado por completo (ver handlers/orders/checkout.ts).
 */
export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

export const shippingAddressSchema = z.object({
  recipient: z.string().min(1).max(200),
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(200).optional(),
  neighborhood: z.string().min(1).max(200),
  city: z.string().min(1).max(120),
  state: z.string().length(2),
  postalCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 00000-000"),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(50),
  shippingAddress: shippingAddressSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
