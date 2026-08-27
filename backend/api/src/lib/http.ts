import type { APIGatewayProxyResultV2 } from "aws-lambda";

const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export function jsonResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: SECURITY_HEADERS,
    body: JSON.stringify(body),
  };
}

export function ok(body: unknown) {
  return jsonResponse(200, body);
}

export function badRequest(message: string, details?: unknown) {
  return jsonResponse(400, { error: message, details });
}

export function unauthorized(message = "Não autenticado.") {
  return jsonResponse(401, { error: message });
}

export function forbidden(message = "Sem permissão para esta ação.") {
  return jsonResponse(403, { error: message });
}

export function notFound(message = "Recurso não encontrado.") {
  return jsonResponse(404, { error: message });
}

/**
 * Resposta de erro genérica pra falhas inesperadas. Item 28 do checklist de
 * segurança: nunca vazar stack trace ou detalhe interno pro cliente — loga
 * completo no CloudWatch, responde só uma mensagem opaca.
 */
export function internalError(error: unknown) {
  console.error("Erro interno não tratado:", error);
  return jsonResponse(500, { error: "Erro interno. Tente novamente mais tarde." });
}
