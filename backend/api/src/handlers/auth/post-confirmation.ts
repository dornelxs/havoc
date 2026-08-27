import type { PostConfirmationTriggerEvent } from "aws-lambda";
import { getDb } from "@/db/client.js";
import { customers } from "@/db/schema.js";

/**
 * Trigger PostConfirmation do Cognito User Pool — dispara automaticamente
 * depois que um usuário confirma o cadastro (via e-mail/código). Cria o
 * registro correspondente em CUSTOMERS.
 *
 * `role` é hardcoded como "customer" aqui, no servidor — este handler nunca
 * lê nem aceita um campo de role vindo do evento do Cognito ou de qualquer
 * outro lugar controlável pelo usuário. É este ponto que fecha o vetor de
 * escalonamento de privilégio descrito na seção 7 da doc técnica: não existe
 * caminho no código, em lugar nenhum, que leia "role" de um payload externo.
 */
export async function handler(
  event: PostConfirmationTriggerEvent
): Promise<PostConfirmationTriggerEvent> {
  const { sub, email, name } = event.request.userAttributes;

  if (!sub || !email) {
    // Nunca deveria acontecer (Cognito garante sub/email em confirmação),
    // mas falha fechada: não deixa o trigger seguir silenciosamente.
    throw new Error("PostConfirmation recebido sem sub ou email do usuário.");
  }

  const db = await getDb();

  await db
    .insert(customers)
    .values({
      cognitoSub: sub,
      email,
      fullName: name ?? null,
      role: "customer",
    })
    .onConflictDoNothing({ target: customers.cognitoSub });

  // Triggers do Cognito devem sempre devolver o evento original.
  return event;
}
