import type { AuthPrincipal } from "../types/Auth.js";

export interface AuthenticationCache {
  get(tokenHash: string): Promise<AuthPrincipal | null>;
  set(
    tokenHash: string,
    principal: AuthPrincipal,
    ttlSeconds: number,
  ): Promise<void>;
  delete(tokenHash: string): Promise<void>;
}
