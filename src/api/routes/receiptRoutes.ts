import multipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";
import { ScanReceipt } from "../../application/use-cases/ScanReceipt.js";
import { ReceiptNormalizer } from "../../domain/entities/ReceiptNormalizer.js";
import type { ImageProcessor } from "../../domain/interfaces/ImageProcessor.js";
import type { ReceiptExtractor } from "../../domain/interfaces/ReceiptExtractor.js";
import {
  createAuthenticationGuard,
  type AccessTokenAuthenticator,
} from "../auth/createAuthenticationGuard.js";
import { ReceiptController } from "../controllers/ReceiptController.js";

const MAX_RECEIPT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_RECEIPT_REQUEST_BYTES = 11 * 1024 * 1024;

export interface ReceiptRoutesOptions {
  imageProcessor: ImageProcessor;
  receiptExtractor: ReceiptExtractor;
  authenticator: AccessTokenAuthenticator;
  receiptScanScopes?: readonly string[];
  lowConfidenceThreshold?: number;
  reconciliationTolerance?: number;
}

export function receiptRoutes(
  options: ReceiptRoutesOptions,
): FastifyPluginAsync {
  return async (app) => {
    await app.register(multipart, {
      limits: { files: 1, fields: 0, fileSize: MAX_RECEIPT_FILE_BYTES },
      throwFileSizeLimit: true,
    });

    const normalizer = new ReceiptNormalizer({
      lowConfidenceThreshold: options.lowConfidenceThreshold ?? 0.75,
      reconciliationTolerance: options.reconciliationTolerance ?? 0.05,
    });
    const controller = new ReceiptController(
      new ScanReceipt(
        options.imageProcessor,
        options.receiptExtractor,
        normalizer,
      ),
    );
    const authenticate = createAuthenticationGuard(
      options.authenticator,
      options.receiptScanScopes ?? ["receipts:scan"],
    );

    app.post(
      "/scan",
      { preHandler: authenticate, bodyLimit: MAX_RECEIPT_REQUEST_BYTES },
      controller.scan,
    );
  };
}
