import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { products } from "@/db/schema.js";
import { listProductsQuerySchema } from "@/schemas/product.js";
import { badRequest, internalError, ok } from "@/lib/http.js";

/**
 * GET /products — listagem pública de catálogo, com filtro opcional de
 * categoria/gênero/tag. Espelha o shape de `Product` esperado pelo frontend
 * (frontend/src/types/product.ts): variants do banco são agregadas em
 * `colorways`. Nunca seleciona `costPrice` — ver item 15 do checklist de
 * segurança em havoc-documentacao-tecnica.md.
 */
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const parsed = listProductsQuerySchema.safeParse(event.queryStringParameters ?? {});
  if (!parsed.success) {
    return badRequest("Parâmetros de busca inválidos.", parsed.error.flatten());
  }
  const { category, gender, tag, limit } = parsed.data;

  try {
    const db = await getDb();

    const filters = [
      category ? eq(products.category, category) : undefined,
      gender ? eq(products.gender, gender) : undefined,
      tag ? sql`${products.tags} @> ${JSON.stringify([tag])}::jsonb` : undefined,
    ].filter((f): f is NonNullable<typeof f> => f !== undefined);

    const rows = await db.query.products.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      limit,
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      columns: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        category: true,
        gender: true,
        description: true,
        features: true,
        tags: true,
        isNew: true,
        isBestSeller: true,
        // supplierId e supplierId-derivados de propósito omitidos — dado
        // interno de operação, não pertence à resposta pública.
      },
      with: {
        variants: {
          columns: {
            id: true,
            colorName: true,
            colorHex: true,
            size: true,
            price: true,
            compareAtPrice: true,
            inStock: true,
            images: true,
            // costPrice deliberadamente ausente desta seleção.
          },
        },
      },
    });

    const catalog = rows.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      brand: "Havoc" as const,
      category: product.category,
      gender: product.gender,
      // Preço/comparativo exibidos a partir da primeira variant — o frontend
      // atual assume um preço único por produto (não por variant); revisar
      // se o catálogo real precisar de preço por cor/tamanho.
      price: Number(product.variants[0]?.price ?? 0),
      compareAtPrice: product.variants[0]?.compareAtPrice
        ? Number(product.variants[0].compareAtPrice)
        : undefined,
      currency: "BRL" as const,
      description: product.description,
      features: product.features,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      tags: product.tags,
      colorways: groupVariantsByColor(product.variants),
    }));

    return ok({ products: catalog });
  } catch (error) {
    return internalError(error);
  }
}

type VariantRow = {
  id: string;
  colorName: string;
  colorHex: string;
  size: string;
  images: string[];
  inStock: boolean;
};

function groupVariantsByColor(rows: VariantRow[]) {
  const byColor = new Map<
    string,
    { id: string; colorName: string; colorHex: string; images: string[]; sizes: { size: string; inStock: boolean }[] }
  >();

  for (const row of rows) {
    const key = row.colorName;
    if (!byColor.has(key)) {
      byColor.set(key, {
        id: row.id,
        colorName: row.colorName,
        colorHex: row.colorHex,
        images: row.images,
        sizes: [],
      });
    }
    byColor.get(key)!.sizes.push({ size: row.size, inStock: row.inStock });
  }

  return Array.from(byColor.values());
}
