import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { products } from "@/db/schema.js";
import { badRequest, internalError, notFound, ok } from "@/lib/http.js";

/**
 * GET /products/{slug} — detalhe de um produto pro PDP. Mesma regra da
 * listagem: nunca seleciona costPrice nem supplierId.
 */
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const slug = event.pathParameters?.slug;
  if (!slug) {
    return badRequest("Parâmetro slug ausente na rota.");
  }

  try {
    const db = await getDb();

    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
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
          },
        },
      },
    });

    if (!product) {
      return notFound(`Produto "${slug}" não encontrado.`);
    }

    return ok({ product });
  } catch (error) {
    return internalError(error);
  }
}
