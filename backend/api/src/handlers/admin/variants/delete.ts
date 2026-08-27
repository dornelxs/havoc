import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { adminAuditLog, variants } from "@/db/schema.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { badRequest, internalError, ok } from "@/lib/http.js";

/**
 * DELETE /admin/variants/{id} — remove uma variante do catálogo.
 *
 * Não remove o produto pai nem afeta pedidos já existentes: `order_items`
 * referencia `variantId` com `onDelete: "restrict"` (ver schema.ts) — se
 * algum pedido já usou esta variante, o delete falha em vez de corromper o
 * histórico do pedido. Nesse caso, prefira desativar via `inStock: false`
 * (upsert) em vez de excluir de fato.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);
    const { auth } = authResult;

    const variantId = event.pathParameters?.id;
    if (!variantId) {
      return badRequest("Parâmetro id ausente na rota.");
    }

    const db = await getDb();

    const [deleted] = await db
      .delete(variants)
      .where(eq(variants.id, variantId))
      .returning({ id: variants.id });

    if (!deleted) {
      return badRequest("Variante não encontrada ou já removida.");
    }

    await db.insert(adminAuditLog).values({
      adminId: auth.customerId,
      action: "variant.delete",
      targetTable: "variants",
      targetId: deleted.id,
    });

    return ok({ id: deleted.id });
  } catch (error) {
    return internalError(error);
  }
}
