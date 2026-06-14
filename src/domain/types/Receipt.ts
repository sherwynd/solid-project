import { z } from "zod";

export const confidenceSchema = z.number().min(0).max(1).nullable();
export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unitPrice: z.number().nonnegative().nullable(),
  amount: z.number().nullable(),
  confidence: confidenceSchema,
});
export const receiptSchema = z.object({
  merchant: z.string().min(1).nullable(),
  date: z.iso.date().nullable(),
  currency: z.string().length(3),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  serviceCharge: z.number().nullable(),
  discount: z.number().nullable(),
  rounding: z.number().nullable(),
  total: z.number().nullable(),
  lineItems: z.array(lineItemSchema),
  confidence: z.object({
    merchant: confidenceSchema,
    date: confidenceSchema,
    currency: confidenceSchema,
    subtotal: confidenceSchema,
    tax: confidenceSchema,
    serviceCharge: confidenceSchema,
    discount: confidenceSchema,
    total: confidenceSchema,
  }),
});
export const scanReceiptResponseSchema = z.object({
  receipt: receiptSchema,
  warnings: z.array(z.string()),
  requiresReview: z.boolean(),
});
export type Receipt = z.infer<typeof receiptSchema>;
export type ReceiptLineItem = z.infer<typeof lineItemSchema>;
export type ScanReceiptResponse = z.infer<typeof scanReceiptResponseSchema>;
