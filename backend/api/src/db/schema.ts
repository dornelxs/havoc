import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
// Espelham os tipos de domínio do frontend em
// frontend/src/types/product.ts — mantenha em sincronia ao editar qualquer um.

export const productCategoryEnum = pgEnum("product_category", [
  "tenis",
  "oculos",
  "relogios",
  "roupas-academia",
]);

export const productGenderEnum = pgEnum("product_gender", [
  "masculino",
  "feminino",
  "unissex",
  "infantil",
]);

export const customerRoleEnum = pgEnum("customer_role", ["customer", "admin"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "awaiting_supplier_order",
  "ordered_from_supplier",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "awaiting_supplier_order",
  "ordered_from_supplier",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

// ---------------------------------------------------------------------------
// SUPPLIERS
// ---------------------------------------------------------------------------

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    subtitle: text("subtitle"),
    category: productCategoryEnum("category").notNull(),
    gender: productGenderEnum("gender").notNull(),
    description: text("description").notNull().default(""),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    isNew: boolean("is_new").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("products_slug_idx").on(table.slug)]
);

// ---------------------------------------------------------------------------
// VARIANTS (cor + tamanho de um produto)
// ---------------------------------------------------------------------------

export const variants = pgTable("variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  colorName: text("color_name").notNull(),
  colorHex: text("color_hex").notNull(),
  size: text("size").notNull(),
  // Preço de venda — visível ao cliente.
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  // Preço de custo do fornecedor — NUNCA deve ser exposto em resposta de API
  // pública. Ver seção 15 do checklist de segurança em
  // havoc-documentacao-tecnica.md.
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  // Disponibilidade é uma estimativa (dropshipping, sem estoque físico real),
  // atualizada manualmente pelo admin conforme informação do fornecedor.
  inStock: boolean("in_stock").notNull().default(true),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// CUSTOMERS
// ---------------------------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Sub (subject) do usuário no Cognito User Pool — vínculo com a identidade
    // autenticada. Nunca aceitar um valor de role vindo do payload do cliente
    // ao gravar/atualizar este registro (ver seção 7 da doc técnica).
    cognitoSub: text("cognito_sub").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    role: customerRoleEnum("role").notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customers_cognito_sub_idx").on(table.cognitoSub),
    uniqueIndex("customers_email_idx").on(table.email),
  ]
);

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Pedido sempre vinculado a uma conta — não existe checkout de convidado
  // (ver seção 7 da doc técnica).
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  // Total recalculado e confirmado no servidor no momento do checkout —
  // nunca um valor recebido do client.
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address").$type<{
    recipient: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// ORDER_ITEMS
// ---------------------------------------------------------------------------

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => variants.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  // Preço unitário congelado no momento da compra (o preço da variant pode
  // mudar depois) — recalculado/validado no servidor no checkout.
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  // Referência do pedido junto ao fornecedor (preenchida pelo admin depois
  // que o pedido é repassado) e status de envio deste item específico —
  // fica no item, não no pedido, porque itens de um mesmo pedido podem vir
  // de fornecedores diferentes com ritmos de fulfillment distintos.
  supplierOrderRef: text("supplier_order_ref"),
  fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
    .notNull()
    .default("awaiting_supplier_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// ADMIN_AUDIT_LOG (seção 10.5 da doc técnica)
// ---------------------------------------------------------------------------

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  targetTable: text("target_table").notNull(),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (uso pelo query builder relacional do Drizzle)
// ---------------------------------------------------------------------------

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  variants: many(variants),
}));

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
}));
