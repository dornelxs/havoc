import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * Popula um banco local/dev com um fornecedor e um produto de exemplo —
 * suficiente para validar o schema e os handlers ponta a ponta. Não tenta
 * replicar o catálogo mock inteiro do frontend (frontend/src/data/products.ts);
 * quando o admin estiver pronto, o catálogo real deve ser cadastrado por ali.
 *
 * Uso: DATABASE_URL=postgres://... npx tsx src/db/seed.ts
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Defina DATABASE_URL antes de rodar o seed.");
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Inserindo fornecedor de exemplo...");
  const [supplier] = await db
    .insert(schema.suppliers)
    .values({
      name: "Fornecedor Exemplo Ltda",
      contactInfo: "contato@fornecedor-exemplo.com",
    })
    .returning();

  if (!supplier) throw new Error("Falha ao inserir fornecedor de seed.");

  console.log("Inserindo produto de exemplo...");
  const [product] = await db
    .insert(schema.products)
    .values({
      supplierId: supplier.id,
      slug: "runner-x",
      name: "Havoc Runner X",
      subtitle: "Tênis de corrida performance",
      category: "tenis",
      gender: "unissex",
      description:
        "O Runner X foi desenvolvido para quem busca performance em cada passada.",
      features: [
        "Entressola em espuma HVC-Boost",
        "Cabedal em mesh respirável",
        "Solado com tração multidirecional",
      ],
      tags: ["corrida", "lançamento"],
      isNew: true,
      isBestSeller: true,
    })
    .returning();

  if (!product) throw new Error("Falha ao inserir produto de seed.");

  console.log("Inserindo variants de exemplo...");
  await db.insert(schema.variants).values([
    {
      productId: product.id,
      colorName: "Preto/Branco",
      colorHex: "#111111",
      size: "40",
      price: "599.90",
      compareAtPrice: "749.90",
      costPrice: "310.00",
      inStock: true,
      images: ["/products/runner-x-black.svg"],
    },
    {
      productId: product.id,
      colorName: "Preto/Branco",
      colorHex: "#111111",
      size: "41",
      price: "599.90",
      compareAtPrice: "749.90",
      costPrice: "310.00",
      inStock: true,
      images: ["/products/runner-x-black.svg"],
    },
  ]);

  console.log("Seed concluído.");
  await client.end();
}

main().catch((error) => {
  console.error("Falha ao rodar o seed:", error);
  process.exit(1);
});
