import type { ExtractedReceipt } from "../types/ExtractedReceipt.js";
export interface ReceiptExtractorInput {
  buffer: Buffer;
  mimeType: string;
}
export interface ReceiptExtractor {
  extract(input: ReceiptExtractorInput): Promise<ExtractedReceipt>;
}
