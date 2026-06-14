export interface ExtractedValue {
  text?: string;
  normalizedText?: string;
  number?: number;
  confidence?: number;
}
export interface ExtractedLineItem {
  description?: ExtractedValue;
  quantity?: ExtractedValue;
  unitPrice?: ExtractedValue;
  amount?: ExtractedValue;
  confidence?: number;
}
export interface ExtractedReceipt {
  merchant?: ExtractedValue;
  date?: ExtractedValue;
  currency?: ExtractedValue;
  subtotal?: ExtractedValue;
  tax?: ExtractedValue;
  serviceCharge?: ExtractedValue;
  discount?: ExtractedValue;
  rounding?: ExtractedValue;
  total?: ExtractedValue;
  lineItems: ExtractedLineItem[];
}
