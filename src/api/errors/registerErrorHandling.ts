import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError, type ErrorCode } from "../../application/errors/AppError.js";
import { InsufficientScopeError } from "../../application/errors/AuthenticationErrors.js";
import { RouteNotFoundError } from "../../application/errors/SystemErrors.js";

interface HttpErrorMapping {
  statusCode: number;
  publicMessage?: string;
}

const HTTP_ERROR_MAPPINGS: Record<ErrorCode, HttpErrorMapping> = {
  AUTH_TOKEN_REQUIRED: { statusCode: 401 },
  AUTH_TOKEN_INVALID: { statusCode: 401 },
  AUTH_TOKEN_EXPIRED: { statusCode: 401 },
  AUTH_SCOPE_INSUFFICIENT: { statusCode: 403 },
  UPLOAD_MULTIPART_REQUIRED: { statusCode: 415 },
  UPLOAD_FILE_REQUIRED: { statusCode: 400 },
  UPLOAD_FIELD_INVALID: { statusCode: 400 },
  UPLOAD_MEDIA_TYPE_UNSUPPORTED: { statusCode: 415 },
  UPLOAD_FILE_TOO_LARGE: { statusCode: 413 },
  IMAGE_FORMAT_UNSUPPORTED: { statusCode: 422 },
  IMAGE_MIME_MISMATCH: { statusCode: 422 },
  IMAGE_UNREADABLE: { statusCode: 422 },
  OCR_PROVIDER_UNAVAILABLE: { statusCode: 502 },
  RECEIPT_RESULT_INVALID: {
    statusCode: 500,
    publicMessage: "The receipt could not be processed.",
  },
  CACHE_NAMESPACE_REQUIRED: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  CACHE_INVALID_TTL: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  CACHE_READ_FAILED: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  CACHE_WRITE_FAILED: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  CACHE_DELETE_FAILED: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  CACHE_CLOSE_FAILED: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  CONFIG_INVALID: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  SERVER_START_FAILED: {
    statusCode: 500,
    publicMessage: "Internal server error.",
  },
  ROUTE_NOT_FOUND: { statusCode: 404 },
};

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler(async (error, request, reply) => {
    await sendError(error, request, reply);
  });
  app.setNotFoundHandler(async (request, reply) => {
    await sendError(new RouteNotFoundError(), request, reply);
  });
}

async function sendError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const appError = error instanceof AppError ? error : null;
  const code = appError?.code ?? "INTERNAL_SERVER_ERROR";
  const mapping = appError
    ? HTTP_ERROR_MAPPINGS[appError.code]
    : { statusCode: 500, publicMessage: "Internal server error." };

  if (mapping.statusCode >= 500)
    request.log.error(
      { err: error, code, requestId: request.id },
      "Request failed",
    );

  setAuthenticationHeader(appError, reply);
  await reply.code(mapping.statusCode).send({
    error:
      mapping.publicMessage ?? appError?.message ?? "Internal server error.",
    code,
    requestId: request.id,
  });
}

function setAuthenticationHeader(
  error: AppError | null,
  reply: FastifyReply,
): void {
  if (!error) return;
  if (error instanceof InsufficientScopeError) {
    reply.header(
      "WWW-Authenticate",
      `Bearer realm="receipt-api", error="insufficient_scope", scope="${error.requiredScopes.join(" ")}"`,
    );
    return;
  }
  if (
    error.code === "AUTH_TOKEN_REQUIRED" ||
    error.code === "AUTH_TOKEN_INVALID" ||
    error.code === "AUTH_TOKEN_EXPIRED"
  )
    reply.header(
      "WWW-Authenticate",
      'Bearer realm="receipt-api", error="invalid_token"',
    );
}
