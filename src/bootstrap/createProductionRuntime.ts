import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { apiRoutes } from "../api/routes/apiRoutes.js";
import { AuthenticateAccessToken } from "../application/use-cases/AuthenticateAccessToken.js";
import { loadEnv } from "../config/env.js";
import { authPrincipalSchema } from "../domain/types/Auth.js";
import { createJsonCacheCodec } from "../infrastructure/cache/JsonCacheCodec.js";
import { GoogleDocumentAiReceiptExtractor } from "../infrastructure/google/GoogleDocumentAiReceiptExtractor.js";
import { SharpImageProcessor } from "../infrastructure/image/SharpImageProcessor.js";
import { JoseAccessTokenVerifier } from "../infrastructure/oauth/JoseAccessTokenVerifier.js";
import { RedisCacheConnection } from "../infrastructure/redis/RedisCache.js";

export interface ProductionRuntime {
  app: FastifyInstance;
  listen: {
    host: string;
    port: number;
  };
}

export async function createProductionRuntime(): Promise<ProductionRuntime> {
  const env = loadEnv();
  const redis = RedisCacheConnection.create(env.REDIS_URL);
  const authCache = redis.createCache(
    "auth",
    createJsonCacheCodec(authPrincipalSchema),
  );
  const authenticator = new AuthenticateAccessToken(
    JoseAccessTokenVerifier.create({
      issuer: env.OAUTH_ISSUER_URL,
      audience: env.OAUTH_AUDIENCE,
      jwksUrl: env.OAUTH_JWKS_URL,
    }),
    authCache,
    { cacheTtlSeconds: env.AUTH_CACHE_TTL_SECONDS },
  );

  try {
    const app = await buildApp({
      routes: apiRoutes({
        receipt: {
          imageProcessor: new SharpImageProcessor(),
          receiptExtractor: GoogleDocumentAiReceiptExtractor.create({
            projectId: env.GOOGLE_CLOUD_PROJECT_ID,
            location: env.GOOGLE_CLOUD_LOCATION,
            processorId: env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID,
          }),
          authenticator,
          receiptScanScopes:
            env.OAUTH_REQUIRED_SCOPE.split(/\s+/).filter(Boolean),
          lowConfidenceThreshold: env.RECEIPT_LOW_CONFIDENCE_THRESHOLD,
          reconciliationTolerance: env.RECEIPT_RECONCILIATION_TOLERANCE,
        },
      }),
      logger: true,
    });
    app.addHook("onClose", async () => redis.close());
    return { app, listen: { host: env.HOST, port: env.PORT } };
  } catch (error) {
    try {
      await redis.close();
    } catch {
      // Preserve the application construction error as the primary failure.
    }
    throw error;
  }
}
