import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import type { AuthenticateAccessToken } from "../../application/use-cases/AuthenticateAccessToken.js";
import { ForbiddenError, UnauthorizedError } from "../../application/errors/AuthenticationErrors.js";

export type AccessTokenAuthenticator = Pick<AuthenticateAccessToken, "execute">;

export function createAuthenticationGuard(
  authenticator: AccessTokenAuthenticator,
  requiredScopes: readonly string[],
): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const token = readBearerToken(request.headers.authorization);
      request.authPrincipal = await authenticator.execute(token, requiredScopes);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        await reply.code(403).send({ error: error.message });
        return;
      }
      if (error instanceof UnauthorizedError) {
        reply.header("WWW-Authenticate", 'Bearer realm="receipt-api", error="invalid_token"');
        await reply.code(401).send({ error: error.message });
        return;
      }
      throw error;
    }
  };
}

function readBearerToken(authorization: string | undefined): string {
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization ?? "");
  if (!match?.[1]) throw new UnauthorizedError("A Bearer access token is required.");
  return match[1];
}
