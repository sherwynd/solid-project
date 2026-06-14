import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from "jose";
import { z } from "zod";
import { UnauthorizedError } from "../../application/errors/AuthenticationErrors.js";
import type { AccessTokenVerifier } from "../../domain/interfaces/AccessTokenVerifier.js";
import { authPrincipalSchema, type AuthPrincipal } from "../../domain/types/Auth.js";

const payloadSchema = z.object({
  sub: z.string().min(1),
  iss: z.url(),
  aud: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  exp: z.number().int().positive(),
  scope: z.string().optional(),
  scp: z.union([z.string(), z.array(z.string())]).optional(),
});

export interface JoseAccessTokenVerifierConfig {
  issuer: string;
  audience: string;
  jwksUrl: string;
  algorithms?: string[];
}

export class JoseAccessTokenVerifier implements AccessTokenVerifier {
  constructor(
    private readonly keyResolver: JWTVerifyGetKey,
    private readonly config: JoseAccessTokenVerifierConfig,
  ) {}

  static create(config: JoseAccessTokenVerifierConfig): JoseAccessTokenVerifier {
    return new JoseAccessTokenVerifier(createRemoteJWKSet(new URL(config.jwksUrl)), config);
  }

  async verify(accessToken: string): Promise<AuthPrincipal> {
    try {
      const result = await jwtVerify(accessToken, this.keyResolver, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: this.config.algorithms ?? ["RS256", "ES256"],
      });
      return mapPayload(result.payload);
    } catch (error) {
      throw new UnauthorizedError("The access token is invalid.", { cause: error });
    }
  }
}

function mapPayload(payload: JWTPayload): AuthPrincipal {
  const parsed = payloadSchema.parse(payload);
  const scopes = parseScopes(parsed.scope ?? parsed.scp);
  return authPrincipalSchema.parse({
    subject: parsed.sub,
    issuer: parsed.iss,
    audience: Array.isArray(parsed.aud) ? parsed.aud : [parsed.aud],
    scopes,
    expiresAt: parsed.exp,
  });
}

function parseScopes(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return [...new Set(value.filter(Boolean))];
  return [...new Set((value ?? "").split(/\s+/).filter(Boolean))];
}
