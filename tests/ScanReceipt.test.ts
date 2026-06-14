import { describe, expect, it, jest } from "@jest/globals";
import { ScanReceipt } from "../src/application/use-cases/ScanReceipt.js";
import { ReceiptNormalizer } from "../src/domain/entities/ReceiptNormalizer.js";
import type { ImageProcessor } from "../src/domain/interfaces/ImageProcessor.js";
import type { ReceiptExtractor } from "../src/domain/interfaces/ReceiptExtractor.js";

describe("ScanReceipt", () => {
  it("uses replaceable image and OCR interfaces", async () => {
    const imageProcessor: ImageProcessor = {
      process: jest.fn(async () => ({
        buffer: Buffer.from("processed"),
        mimeType: "image/jpeg",
      })),
    };
    const receiptExtractor: ReceiptExtractor = {
      extract: jest.fn(async () => ({
        merchant: { text: "Store" },
        total: { number: 5 },
        lineItems: [],
      })),
    };
    const useCase = new ScanReceipt(
      imageProcessor,
      receiptExtractor,
      new ReceiptNormalizer({
        lowConfidenceThreshold: 0.75,
        reconciliationTolerance: 0.05,
      }),
    );
    const result = await useCase.execute({
      buffer: Buffer.from("original"),
      mimeType: "image/png",
    });
    expect(imageProcessor.process).toHaveBeenCalledWith(
      Buffer.from("original"),
      "image/png",
    );
    expect(receiptExtractor.extract).toHaveBeenCalledWith({
      buffer: Buffer.from("processed"),
      mimeType: "image/jpeg",
    });
    expect(result.receipt.merchant).toBe("Store");
  });
});
