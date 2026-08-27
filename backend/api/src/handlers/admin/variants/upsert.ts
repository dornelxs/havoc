import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { adminAuditLog, variants } from "@/db/schema.js";
import { upsertVariantSchema } from "@/schemas/variant.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { badRequest, internalError, ok } from "@/lib/http.js";

/**
 * POST /admin/variants (criação) e PUT /admin/variants/{id} (atualização).
 *
 * Único endpoint da aplicação que aceita `costPrice` vindo de um payload —
 * seguro porque `requireAdmin` já garantiu `role === "admin"` antes de
 * qualquer campo do corpo ser lido. Nenhuma rota pública ou de cliente
 * autenticado deve repetir esse padrão para custo/margem.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);
    const { auth } = authResult;

    const rawBody = event.body ? JSON.parse(event.body) : null;
    const parsed = upsertVariantSchema.safeParse(rawBody);
    if (!parsed.success) {
      return badRequest("Payload de variante inválido.", parsed.error.flatten());
    }

    const db = await getDb();
    const variantId = event.pathParameters?.id;

    const [saved] = variantId
      ? await db
          .update(variants)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(variants.id, variantId))
          .returning({ id: variants.id })
      : await db.insert(variants).values(parsed.data).returning({ id: variants.id });

    if (!saved) {
      return badRequest("Não foi possível salvar a variante.");
    }

    await db.insert(adminAuditLog).values({
      adminId: auth.customerId,
      action: variantId ? "variant.update" : "variant.create",
      targetTable: "variants",
      targetId: saved.id,
      metadata: {
        productId: parsed.data.productId,
        colorName: parsed.data.colorName,
        size: parsed.data.size,
      },
    });

    return ok({ id: saved.id });
  } catch (error) {
    return internalError(error);
  }
}
