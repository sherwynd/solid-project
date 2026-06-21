import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import type { AuthenticateAccessToken } from "../../application/use-cases/AuthenticateAccessToken.js";
import { AccessTokenRequiredError } from "../../application/errors/AuthenticationErrors.js";

export type AccessTokenAuthenticator = Pick<AuthenticateAccessToken, "execute">;

export function createAuthenticationGuard(
  authenticator: AccessTokenAuthenticator,
  requiredScopes: readonly string[],
): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest): Promise<void> => {
    const token = readBearerToken(request.headers.authorization);
    request.authPrincipal = await authenticator.execute(token, requiredScopes);
  };
}

function readBearerToken(authorization: string | undefined): string {
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization ?? "");
  if (!match?.[1]) throw new AccessTokenRequiredError();
  return match[1];
}
