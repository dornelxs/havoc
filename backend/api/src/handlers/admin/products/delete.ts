import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { adminAuditLog, products } from "@/db/schema.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { badRequest, internalError, ok } from "@/lib/http.js";

/**
 * DELETE /admin/products/{id} — remove um produto e suas variants em
 * cascata (`variants.productId` tem `onDelete: "cascade"`, ver schema.ts).
 *
 * Igual ao delete de variant: se alguma variant deste produto já foi usada
 * num pedido, o cascade de variants esbarra no `onDelete: "restrict"` de
 * `order_items.variantId` e a operação inteira falha — o que é o
 * comportamento correto (nunca apagar produto que já tem histórico de
 * venda). Nesse caso, o produto deve ser descontinuado por outro caminho
 * (ex.: campo de status "inativo", ainda não modelado) em vez de excluído.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);
    const { auth } = authResult;

    const productId = event.pathParameters?.id;
    if (!productId) {
      return badRequest("Parâmetro id ausente na rota.");
    }

    const db = await getDb();

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning({ id: products.id, slug: products.slug });

    if (!deleted) {
      return badRequest("Produto não encontrado ou já removido.");
    }

    await db.insert(adminAuditLog).values({
      adminId: auth.customerId,
      action: "product.delete",
      targetTable: "products",
      targetId: deleted.id,
      metadata: { slug: deleted.slug },
    });

    return ok({ id: deleted.id });
  } catch (error) {
    return internalError(error);
  }
}
