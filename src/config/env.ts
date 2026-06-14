import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  GOOGLE_CLOUD_PROJECT_ID: z.string().min(1),
  GOOGLE_CLOUD_LOCATION: z.string().min(1).default("us"),
  GOOGLE_DOCUMENT_AI_PROCESSOR_ID: z.string().min(1),
  RECEIPT_LOW_CONFIDENCE_THRESHOLD: z.coerce
    .number()
    .min(0)
    .max(1)
    .default(0.75),
  RECEIPT_RECONCILIATION_TOLERANCE: z.coerce.number().min(0).default(0.05),
});
export type AppEnv = z.infer<typeof envSchema>;
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
