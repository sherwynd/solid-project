import type { ImageProcessor } from "../../domain/interfaces/ImageProcessor.js";
import type { ReceiptExtractor } from "../../domain/interfaces/ReceiptExtractor.js";
import { ReceiptNormalizer } from "../../domain/entities/ReceiptNormalizer.js";
import {
  scanReceiptResponseSchema,
  type ScanReceiptResponse,
} from "../../domain/types/Receipt.js";
import { ReceiptResultInvalidError } from "../errors/ReceiptErrors.js";

export interface ScanReceiptInput {
  buffer: Buffer;
  mimeType: string;
}
export class ScanReceipt {
  constructor(
    private readonly imageProcessor: ImageProcessor,
    private readonly receiptExtractor: ReceiptExtractor,
    private readonly normalizer: ReceiptNormalizer,
  ) {}
  async execute(input: ScanReceiptInput): Promise<ScanReceiptResponse> {
    const image = await this.imageProcessor.process(
      input.buffer,
      input.mimeType,
    );
    const normalized = this.normalizer.normalize(
      await this.receiptExtractor.extract(image),
    );
    const result = scanReceiptResponseSchema.safeParse(normalized);
    if (!result.success)
      throw new ReceiptResultInvalidError({ cause: result.error });
    return result.data;
  }
}
