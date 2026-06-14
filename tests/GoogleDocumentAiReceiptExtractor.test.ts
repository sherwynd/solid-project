import { describe, expect, it, jest } from "@jest/globals";
import {
  GoogleDocumentAiReceiptExtractor,
  ReceiptExtractionError,
  type DocumentAiClient,
} from "../src/infrastructure/google/GoogleDocumentAiReceiptExtractor.js";

describe("GoogleDocumentAiReceiptExtractor", () => {
  it("maps a successful response including SST and service charge", async () => {
    const client: DocumentAiClient = {
      processDocument: jest.fn(async () => [
        {
          document: {
            entities: [
              { type: "supplier_name", mentionText: "Cafe", confidence: 0.9 },
              {
                type: "total_tax_amount",
                mentionText: "SST 3.00",
                confidence: 0.8,
              },
              { type: "service_charge", mentionText: "5.00", confidence: 0.85 },
              {
                type: "total_amount",
                normalizedValue: {
                  moneyValue: { units: 58, nanos: 0, currencyCode: "MYR" },
                },
                confidence: 0.95,
              },
            ],
          },
        },
        undefined,
        undefined,
      ]),
    };
    const extractor = new GoogleDocumentAiReceiptExtractor(client, {
      projectId: "p",
      location: "us",
      processorId: "id",
    });
    expect(
      await extractor.extract({
        buffer: Buffer.from("image"),
        mimeType: "image/jpeg",
      }),
    ).toMatchObject({
      merchant: { text: "Cafe" },
      tax: { text: "SST 3.00" },
      serviceCharge: { text: "5.00" },
      total: { number: 58 },
    });
  });
  it("wraps provider failures without exposing details", async () => {
    const client: DocumentAiClient = {
      processDocument: jest.fn(async () => {
        throw new Error("secret credential text");
      }),
    };
    const extractor = new GoogleDocumentAiReceiptExtractor(client, {
      projectId: "p",
      location: "us",
      processorId: "id",
    });
    const promise = extractor.extract({
      buffer: Buffer.from("image"),
      mimeType: "image/jpeg",
    });
    await expect(promise).rejects.toThrow(ReceiptExtractionError);
    await expect(promise).rejects.not.toThrow("secret credential text");
  });
});
