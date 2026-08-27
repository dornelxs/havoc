import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { adminAuditLog, products } from "@/db/schema.js";
import { upsertProductSchema } from "@/schemas/product.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { badRequest, internalError, ok } from "@/lib/http.js";

/**
 * POST /admin/products — cria ou atualiza um produto do catálogo.
 * Rota admin-only. Padrão de referência para qualquer endpoint de escrita
 * do painel administrativo:
 *
 *   1. Resolver auth (quem está chamando) — nunca pular esta etapa.
 *   2. Checar role === "admin" explicitamente (defesa em profundidade além
 *      do que o API Gateway Authorizer já filtra).
 *   3. Validar o payload contra uma allowlist estrita via Zod — o schema
 *      define exatamente os campos aceitos; nada além disso entra no banco
 *      (item 8 do checklist de segurança: bloquear mass assignment).
 *   4. Registrar a ação em admin_audit_log (seção 10.5 da doc técnica) —
 *      toda mutação feita por um admin é rastreável depois.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);
    const { auth } = authResult;

    const rawBody = event.body ? JSON.parse(event.body) : null;
    const parsed = upsertProductSchema.safeParse(rawBody);
    if (!parsed.success) {
      return badRequest("Payload de produto inválido.", parsed.error.flatten());
    }

    const db = await getDb();
    const productId = event.pathParameters?.id;

    const [saved] = productId
      ? await db
          .update(products)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(products.id, productId))
          .returning({ id: products.id })
      : await db.insert(products).values(parsed.data).returning({ id: products.id });

    if (!saved) {
      return badRequest("Não foi possível salvar o produto.");
    }

    await db.insert(adminAuditLog).values({
      adminId: auth.customerId,
      action: productId ? "product.update" : "product.create",
      targetTable: "products",
      targetId: saved.id,
      metadata: { slug: parsed.data.slug },
    });

    return ok({ id: saved.id });
  } catch (error) {
    return internalError(error);
  }
}
