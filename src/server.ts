import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { GoogleDocumentAiReceiptExtractor } from "./infrastructure/google/GoogleDocumentAiReceiptExtractor.js";
import { SharpImageProcessor } from "./infrastructure/image/SharpImageProcessor.js";

export async function startServer(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp({
    imageProcessor: new SharpImageProcessor(),
    receiptExtractor: GoogleDocumentAiReceiptExtractor.create({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      location: env.GOOGLE_CLOUD_LOCATION,
      processorId: env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID,
    }),
    lowConfidenceThreshold: env.RECEIPT_LOW_CONFIDENCE_THRESHOLD,
    reconciliationTolerance: env.RECEIPT_RECONCILIATION_TOLERANCE,
    logger: true,
  });
  await app.listen({ port: env.PORT, host: env.HOST });
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
