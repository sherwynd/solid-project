import {
  DocumentProcessorServiceClient,
  protos,
} from "@google-cloud/documentai";
import { z } from "zod";
import type {
  ReceiptExtractor,
  ReceiptExtractorInput,
} from "../../domain/interfaces/ReceiptExtractor.js";
import type {
  ExtractedLineItem,
  ExtractedReceipt,
  ExtractedValue,
} from "../../domain/types/ExtractedReceipt.js";

const documentSchema = z.object({
  entities: z
    .array(z.custom<protos.google.cloud.documentai.v1.Document.IEntity>())
    .optional()
    .default([]),
});
export interface GoogleDocumentAiExtractorConfig {
  projectId: string;
  location: string;
  processorId: string;
}
export interface DocumentAiClient {
  processDocument(
    request: protos.google.cloud.documentai.v1.IProcessRequest,
  ): Promise<
    [
      protos.google.cloud.documentai.v1.IProcessResponse,
      protos.google.cloud.documentai.v1.IProcessRequest | undefined,
      object | undefined,
    ]
  >;
}
export class ReceiptExtractionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ReceiptExtractionError";
  }
}

export class GoogleDocumentAiReceiptExtractor implements ReceiptExtractor {
  private readonly processorName: string;
  constructor(
    private readonly client: DocumentAiClient,
    config: GoogleDocumentAiExtractorConfig,
  ) {
    this.processorName = `projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;
  }
  static create(
    config: GoogleDocumentAiExtractorConfig,
  ): GoogleDocumentAiReceiptExtractor {
    return new GoogleDocumentAiReceiptExtractor(
      new DocumentProcessorServiceClient({
        apiEndpoint: `${config.location}-documentai.googleapis.com`,
      }),
      config,
    );
  }
  async extract(input: ReceiptExtractorInput): Promise<ExtractedReceipt> {
    try {
      const [response] = await this.client.processDocument({
        name: this.processorName,
        rawDocument: {
          content: input.buffer.toString("base64"),
          mimeType: input.mimeType,
        },
      });
      return mapDocument(
        documentSchema.parse(response.document ?? {}).entities,
      );
    } catch (error) {
      throw new ReceiptExtractionError(
        "Google Document AI could not process the receipt.",
        { cause: error },
      );
    }
  }
}

const ALIASES: Record<string, keyof Omit<ExtractedReceipt, "lineItems">> = {
  supplier_name: "merchant",
  merchant_name: "merchant",
  receipt_date: "date",
  invoice_date: "date",
  currency: "currency",
  currency_code: "currency",
  net_amount: "subtotal",
  subtotal: "subtotal",
  total_tax_amount: "tax",
  tax_amount: "tax",
  service_charge: "serviceCharge",
  service_charge_amount: "serviceCharge",
  discount: "discount",
  discount_amount: "discount",
  rounding: "rounding",
  rounding_amount: "rounding",
  total_amount: "total",
  amount_due: "total",
};
function mapDocument(
  entities: protos.google.cloud.documentai.v1.Document.IEntity[],
): ExtractedReceipt {
  const result: ExtractedReceipt = { lineItems: [] };
  for (const entity of entities) {
    const type = entity.type?.toLowerCase() ?? "";
    if (type === "line_item") result.lineItems.push(mapLineItem(entity));
    else {
      const field = ALIASES[type];
      if (field) result[field] = mapValue(entity);
    }
  }
  return result;
}
function mapLineItem(
  entity: protos.google.cloud.documentai.v1.Document.IEntity,
): ExtractedLineItem {
  const item: ExtractedLineItem = {};
  if (entity.confidence != null) item.confidence = entity.confidence;
  for (const property of entity.properties ?? []) {
    const type = property.type?.toLowerCase() ?? "",
      value = mapValue(property);
    if (
      ["line_item/description", "description", "item_description"].includes(
        type,
      )
    )
      item.description = value;
    if (["line_item/quantity", "quantity"].includes(type))
      item.quantity = value;
    if (["line_item/unit_price", "unit_price"].includes(type))
      item.unitPrice = value;
    if (["line_item/amount", "amount", "line_item/total_price"].includes(type))
      item.amount = value;
  }
  return item;
}
function mapValue(
  entity: protos.google.cloud.documentai.v1.Document.IEntity,
): ExtractedValue {
  const value: ExtractedValue = {},
    normalized = entity.normalizedValue,
    money = normalized?.moneyValue,
    date = normalized?.dateValue;
  if (entity.mentionText != null) value.text = entity.mentionText;
  if (date)
    value.normalizedText = `${String(date.year ?? 0)}-${String(date.month ?? 0).padStart(2, "0")}-${String(date.day ?? 0).padStart(2, "0")}`;
  else if (normalized?.text != null) value.normalizedText = normalized.text;
  if (money)
    value.number =
      Number(money.units ?? 0) + (money.nanos ?? 0) / 1_000_000_000;
  if (entity.confidence != null) value.confidence = entity.confidence;
  return value;
}
