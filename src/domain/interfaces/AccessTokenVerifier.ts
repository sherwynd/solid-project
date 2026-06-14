import type { AuthPrincipal } from "../types/Auth.js";

export interface AccessTokenVerifier {
  verify(accessToken: string): Promise<AuthPrincipal>;
}
