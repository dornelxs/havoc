import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { adminAuditLog, suppliers } from "@/db/schema.js";
import { upsertSupplierSchema } from "@/schemas/supplier.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { badRequest, internalError, ok } from "@/lib/http.js";

/**
 * POST /admin/suppliers (criação) e PUT /admin/suppliers/{id} (atualização).
 * Mesmo padrão de admin/products/upsert.ts — ver aquele arquivo para o
 * checklist completo do que todo endpoint admin de escrita precisa seguir.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);
    const { auth } = authResult;

    const rawBody = event.body ? JSON.parse(event.body) : null;
    const parsed = upsertSupplierSchema.safeParse(rawBody);
    if (!parsed.success) {
      return badRequest("Payload de fornecedor inválido.", parsed.error.flatten());
    }

    const db = await getDb();
    const supplierId = event.pathParameters?.id;

    const [saved] = supplierId
      ? await db
          .update(suppliers)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(suppliers.id, supplierId))
          .returning({ id: suppliers.id })
      : await db.insert(suppliers).values(parsed.data).returning({ id: suppliers.id });

    if (!saved) {
      return badRequest("Não foi possível salvar o fornecedor.");
    }

    await db.insert(adminAuditLog).values({
      adminId: auth.customerId,
      action: supplierId ? "supplier.update" : "supplier.create",
      targetTable: "suppliers",
      targetId: saved.id,
      metadata: { name: parsed.data.name },
    });

    return ok({ id: saved.id });
  } catch (error) {
    return internalError(error);
  }
}
