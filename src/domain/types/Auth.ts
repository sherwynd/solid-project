import { z } from "zod";

export const authPrincipalSchema = z.object({
  subject: z.string().min(1),
  issuer: z.url(),
  audience: z.array(z.string().min(1)).min(1),
  scopes: z.array(z.string().min(1)),
  expiresAt: z.number().int().positive(),
});

export type AuthPrincipal = z.infer<typeof authPrincipalSchema>;
