import { createHash } from "node:crypto";
import type { AccessTokenVerifier } from "../../domain/interfaces/AccessTokenVerifier.js";
import type { AuthenticationCache } from "../../domain/interfaces/AuthenticationCache.js";
import type { AuthPrincipal } from "../../domain/types/Auth.js";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../errors/AuthenticationErrors.js";

export interface AuthenticateAccessTokenOptions {
  cacheTtlSeconds: number;
  now?: () => number;
}

export class AuthenticateAccessToken {
  private readonly now: () => number;

  constructor(
    private readonly verifier: AccessTokenVerifier,
    private readonly cache: AuthenticationCache,
    private readonly options: AuthenticateAccessTokenOptions,
  ) {
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000));
  }

  async execute(
    accessToken: string,
    requiredScopes: readonly string[],
  ): Promise<AuthPrincipal> {
    if (!accessToken) throw new UnauthorizedError();
    const tokenHash = createHash("sha256").update(accessToken).digest("hex");
    const now = this.now();
    let principal = await this.readCache(tokenHash, now);

    if (!principal) {
      try {
        principal = await this.verifier.verify(accessToken);
      } catch (error) {
        if (error instanceof UnauthorizedError) throw error;
        throw new UnauthorizedError(undefined, { cause: error });
      }
      if (principal.expiresAt <= now)
        throw new UnauthorizedError("The access token has expired.");
      const ttl = Math.min(
        this.options.cacheTtlSeconds,
        principal.expiresAt - now,
      );
      if (ttl > 0) await this.writeCache(tokenHash, principal, ttl);
    }

    const granted = new Set(principal.scopes);
    if (!requiredScopes.every((scope) => granted.has(scope)))
      throw new ForbiddenError();
    return principal;
  }

  private async readCache(
    tokenHash: string,
    now: number,
  ): Promise<AuthPrincipal | null> {
    try {
      const principal = await this.cache.get(tokenHash);
      if (principal && principal.expiresAt <= now) {
        await this.cache.delete(tokenHash);
        return null;
      }
      return principal;
    } catch {
      return null;
    }
  }

  private async writeCache(
    tokenHash: string,
    principal: AuthPrincipal,
    ttl: number,
  ): Promise<void> {
    try {
      await this.cache.set(tokenHash, principal, ttl);
    } catch {
      // Authentication remains available when Redis is temporarily unavailable.
    }
  }
}
