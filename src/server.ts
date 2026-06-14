import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { GoogleDocumentAiReceiptExtractor } from "./infrastructure/google/GoogleDocumentAiReceiptExtractor.js";
import { SharpImageProcessor } from "./infrastructure/image/SharpImageProcessor.js";
import { AuthenticateAccessToken } from "./application/use-cases/AuthenticateAccessToken.js";
import { JoseAccessTokenVerifier } from "./infrastructure/oauth/JoseAccessTokenVerifier.js";
import { RedisAuthenticationCache } from "./infrastructure/redis/RedisAuthenticationCache.js";

export async function startServer(): Promise<void> {
  const env = loadEnv();
  const authCache = RedisAuthenticationCache.create(env.REDIS_URL);
  const authenticator = new AuthenticateAccessToken(
    JoseAccessTokenVerifier.create({
      issuer: env.OAUTH_ISSUER_URL,
      audience: env.OAUTH_AUDIENCE,
      jwksUrl: env.OAUTH_JWKS_URL,
    }),
    authCache,
    { cacheTtlSeconds: env.AUTH_CACHE_TTL_SECONDS },
  );
  const app = await buildApp({
    imageProcessor: new SharpImageProcessor(),
    receiptExtractor: GoogleDocumentAiReceiptExtractor.create({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      location: env.GOOGLE_CLOUD_LOCATION,
      processorId: env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID,
    }),
    authenticator,
    receiptScanScopes: env.OAUTH_REQUIRED_SCOPE.split(/\s+/).filter(Boolean),
    lowConfidenceThreshold: env.RECEIPT_LOW_CONFIDENCE_THRESHOLD,
    reconciliationTolerance: env.RECEIPT_RECONCILIATION_TOLERANCE,
    logger: true,
  });
  app.addHook("onClose", async () => authCache.close());
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    await app.close();
    throw error;
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
