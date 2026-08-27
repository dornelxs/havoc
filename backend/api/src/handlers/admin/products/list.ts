import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDb } from "@/db/client.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { internalError, ok } from "@/lib/http.js";

/**
 * GET /admin/products — listagem de produtos pro painel administrativo.
 *
 * Diferente de GET /products (catálogo público): esta rota é a única que
 * pode incluir `costPrice` na resposta, pra permitir o admin ver a margem
 * lado a lado com o preço de venda (seção 8 da doc técnica). É seguro
 * porque `requireAdmin` barra qualquer chamada que não seja de um admin
 * autenticado antes de a query nem rodar.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);

    const db = await getDb();

    const rows = await db.query.products.findMany({
      orderBy: (p, { desc }) => [desc(p.updatedAt)],
      with: {
        supplier: { columns: { id: true, name: true } },
        variants: {
          columns: {
            id: true,
            colorName: true,
            size: true,
            price: true,
            costPrice: true,
            inStock: true,
          },
        },
      },
    });

    const withMargin = rows.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        marginAbsolute: (Number(variant.price) - Number(variant.costPrice)).toFixed(2),
        marginPercent:
          Number(variant.price) > 0
            ? (
                ((Number(variant.price) - Number(variant.costPrice)) / Number(variant.price)) *
                100
              ).toFixed(1)
            : null,
      })),
    }));

    return ok({ products: withMargin });
  } catch (error) {
    return internalError(error);
  }
}
