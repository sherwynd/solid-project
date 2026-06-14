import type {
  ExtractedLineItem,
  ExtractedReceipt,
  ExtractedValue,
} from "../types/ExtractedReceipt.js";
import type {
  Receipt,
  ReceiptLineItem,
  ScanReceiptResponse,
} from "../types/Receipt.js";

const LABELS = {
  merchant: "merchant",
  date: "receipt date",
  subtotal: "subtotal",
  tax: "SST/tax",
  serviceCharge: "service charge",
  total: "total",
} as const;
export interface ReceiptNormalizerOptions {
  lowConfidenceThreshold: number;
  reconciliationTolerance: number;
}

export class ReceiptNormalizer {
  constructor(private readonly options: ReceiptNormalizerOptions) {}

  normalize(extracted: ExtractedReceipt): ScanReceiptResponse {
    const warnings: string[] = [];
    const receipt: Receipt = {
      merchant: cleanText(extracted.merchant),
      date: normalizeDate(extracted.date),
      currency: normalizeCurrency(extracted.currency),
      subtotal: normalizeMoney(extracted.subtotal),
      tax: normalizeMoney(extracted.tax),
      serviceCharge: normalizeMoney(extracted.serviceCharge),
      discount: normalizeDiscount(extracted.discount),
      rounding: moneyValue(extracted.rounding),
      total: normalizeMoney(extracted.total),
      lineItems: extracted.lineItems
        .map(normalizeLineItem)
        .filter((item) => item.description.length > 0),
      confidence: {
        merchant: score(extracted.merchant),
        date: score(extracted.date),
        currency: score(extracted.currency),
        subtotal: score(extracted.subtotal),
        tax: score(extracted.tax),
        serviceCharge: score(extracted.serviceCharge),
        discount: score(extracted.discount),
        total: score(extracted.total),
      },
    };
    for (const field of Object.keys(LABELS) as (keyof typeof LABELS)[]) {
      if (receipt[field] === null) warnings.push(`Missing ${LABELS[field]}.`);
      const confidence = receipt.confidence[field];
      if (
        confidence !== null &&
        confidence < this.options.lowConfidenceThreshold
      )
        warnings.push(
          `Low confidence for ${LABELS[field]} (${confidence.toFixed(2)}).`,
        );
    }
    if (!extracted.currency)
      warnings.push(
        "Currency was not detected; defaulted to MYR for Malaysian receipts.",
      );
    if (receipt.date === null && extracted.date)
      warnings.push("Receipt date format could not be normalized.");
    this.reconcile(receipt, warnings);
    return { receipt, warnings, requiresReview: warnings.length > 0 };
  }

  private reconcile(receipt: Receipt, warnings: string[]): void {
    if (receipt.total === null || receipt.subtotal === null) return;
    const expected = round(
      receipt.subtotal +
        (receipt.tax ?? 0) +
        (receipt.serviceCharge ?? 0) -
        (receipt.discount ?? 0) +
        (receipt.rounding ?? 0),
    );
    if (
      Math.abs(expected - receipt.total) > this.options.reconciliationTolerance
    )
      warnings.push(
        `Financial totals do not reconcile: expected ${expected.toFixed(2)}, found ${receipt.total.toFixed(2)}.`,
      );
  }
}

function cleanText(value?: ExtractedValue): string | null {
  const text = (value?.normalizedText ?? value?.text)
    ?.replace(/\s+/g, " ")
    .trim();
  return text && text.length > 0 ? text : null;
}
function normalizeCurrency(value?: ExtractedValue): string {
  const raw = (value?.normalizedText ?? value?.text ?? "").trim().toUpperCase();
  if (raw === "RM" || raw === "MYR" || raw.includes("RINGGIT")) return "MYR";
  return /^[A-Z]{3}$/.test(raw) ? raw : "MYR";
}
function normalizeDate(value?: ExtractedValue): string | null {
  const raw = (value?.normalizedText ?? value?.text ?? "").trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso && validDate(Number(iso[1]), Number(iso[2]), Number(iso[3])))
    return raw;
  const local = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/.exec(raw);
  if (!local) return null;
  const yearPart = local[3] ?? "";
  const year = Number(yearPart) + (yearPart.length === 2 ? 2000 : 0),
    month = Number(local[2]),
    day = Number(local[1]);
  if (!validDate(year, month, day)) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function validDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
function normalizeMoney(value?: ExtractedValue): number | null {
  const amount = moneyValue(value);
  return amount === null ? null : Math.abs(amount);
}
function normalizeDiscount(value?: ExtractedValue): number | null {
  const amount = moneyValue(value);
  return amount === null ? null : Math.abs(amount);
}
function moneyValue(value?: ExtractedValue): number | null {
  if (typeof value?.number === "number" && Number.isFinite(value.number))
    return round(value.number);
  const raw = value?.normalizedText ?? value?.text;
  if (!raw) return null;
  const parsed = Number.parseFloat(
    raw.replace(/MYR|RM|\s|,/gi, "").replace(/[^0-9.+-]/g, ""),
  );
  if (!Number.isFinite(parsed)) return null;
  return round(/\(.*\)/.test(raw) ? -Math.abs(parsed) : parsed);
}
function score(value?: ExtractedValue): number | null {
  return typeof value?.confidence === "number"
    ? Math.max(0, Math.min(1, value.confidence))
    : null;
}
function normalizeLineItem(item: ExtractedLineItem): ReceiptLineItem {
  const quantity =
    item.quantity?.number ??
    Number.parseFloat(
      item.quantity?.normalizedText ?? item.quantity?.text ?? "",
    );
  return {
    description: cleanText(item.description) ?? "",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : null,
    unitPrice: normalizeMoney(item.unitPrice),
    amount: moneyValue(item.amount),
    confidence:
      typeof item.confidence === "number"
        ? Math.max(0, Math.min(1, item.confidence))
        : null,
  };
}
function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
