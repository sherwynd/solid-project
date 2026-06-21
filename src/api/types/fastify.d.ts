import "fastify";
import type { AuthPrincipal } from "../../domain/types/Auth.js";

declare module "fastify" {
  interface FastifyRequest {
    authPrincipal: AuthPrincipal | null;
  }
}
