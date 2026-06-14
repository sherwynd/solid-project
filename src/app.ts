import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { ReceiptNormalizer } from "./domain/entities/ReceiptNormalizer.js";
import type { ImageProcessor } from "./domain/interfaces/ImageProcessor.js";
import type { ReceiptExtractor } from "./domain/interfaces/ReceiptExtractor.js";
import { ScanReceipt } from "./application/use-cases/ScanReceipt.js";
import { ReceiptController } from "./presentation/controllers/ReceiptController.js";
import { receiptRoutes } from "./presentation/routes/receiptRoutes.js";
import {
  createAuthenticationGuard,
  type AccessTokenAuthenticator,
} from "./presentation/auth/createAuthenticationGuard.js";

export interface BuildAppOptions {
  imageProcessor: ImageProcessor;
  receiptExtractor: ReceiptExtractor;
  authenticator: AccessTokenAuthenticator;
  receiptScanScopes?: readonly string[];
  lowConfidenceThreshold?: number;
  reconciliationTolerance?: number;
  logger?: boolean;
}
export async function buildApp(
  options: BuildAppOptions,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 11 * 1024 * 1024,
  });
  await app.register(multipart, {
    limits: { files: 1, fields: 0, fileSize: 10 * 1024 * 1024 },
    throwFileSizeLimit: true,
  });
  app.decorateRequest("authPrincipal", null);
  const normalizer = new ReceiptNormalizer({
    lowConfidenceThreshold: options.lowConfidenceThreshold ?? 0.75,
    reconciliationTolerance: options.reconciliationTolerance ?? 0.05,
  });
  await app.register(
    receiptRoutes(
      new ReceiptController(
        new ScanReceipt(
          options.imageProcessor,
          options.receiptExtractor,
          normalizer,
        ),
      ),
      createAuthenticationGuard(
        options.authenticator,
        options.receiptScanScopes ?? ["receipts:scan"],
      ),
    ),
    { prefix: "/api/v1/receipts" },
  );
  return app;
}
