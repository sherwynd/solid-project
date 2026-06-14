import { describe, expect, it } from "@jest/globals";
import { ReceiptNormalizer } from "../src/domain/entities/ReceiptNormalizer.js";
const normalizer = new ReceiptNormalizer({
  lowConfidenceThreshold: 0.75,
  reconciliationTolerance: 0.05,
});

describe("ReceiptNormalizer", () => {
  it("normalizes Malaysian currency, date, SST, service charge, discount, rounding and line items", () => {
    const result = normalizer.normalize({
      merchant: { text: "  Kedai Makan  ", confidence: 0.99 },
      date: { text: "31/05/2026", confidence: 0.98 },
      currency: { text: "RM", confidence: 0.99 },
      subtotal: { text: "RM 100.00", confidence: 0.95 },
      tax: { text: "SST 6.00", confidence: 0.93 },
      serviceCharge: { text: "10.00", confidence: 0.92 },
      discount: { text: "-5.00", confidence: 0.91 },
      rounding: { text: "-0.01" },
      total: { text: "110.99", confidence: 0.98 },
      lineItems: [
        {
          description: { text: "Nasi Lemak" },
          quantity: { text: "2" },
          unitPrice: { text: "5.00" },
          amount: { text: "10.00" },
          confidence: 0.9,
        },
      ],
    });
    expect(result.receipt).toMatchObject({
      merchant: "Kedai Makan",
      date: "2026-05-31",
      currency: "MYR",
      tax: 6,
      serviceCharge: 10,
      discount: 5,
      rounding: -0.01,
      total: 110.99,
    });
    expect(result.receipt.lineItems[0]).toMatchObject({
      description: "Nasi Lemak",
      quantity: 2,
      unitPrice: 5,
      amount: 10,
    });
    expect(result.requiresReview).toBe(false);
  });
  it("requires review for missing and low-confidence fields", () => {
    const result = normalizer.normalize({
      merchant: { text: "Shop", confidence: 0.4 },
      total: { text: "12.00", confidence: 0.5 },
      lineItems: [],
    });
    expect(result.requiresReview).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Low confidence for merchant"),
        expect.stringContaining("Missing receipt date"),
      ]),
    );
  });
  it("warns when financial totals do not reconcile", () => {
    const result = normalizer.normalize({
      merchant: { text: "Shop" },
      date: { text: "01/06/2026" },
      currency: { text: "MYR" },
      subtotal: { number: 10 },
      tax: { number: 0.6 },
      serviceCharge: { number: 1 },
      discount: { number: 0 },
      total: { number: 15 },
      lineItems: [],
    });
    expect(result.warnings).toContain(
      "Financial totals do not reconcile: expected 11.60, found 15.00.",
    );
  });
});
