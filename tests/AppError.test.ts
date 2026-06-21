import { describe, expect, it } from "@jest/globals";
import { ReceiptExtractionUnavailableError } from "../src/application/errors/ReceiptErrors.js";

describe("AppError", () => {
  it("preserves a stable code, concrete name, stack, and original cause", () => {
    const cause = new Error("provider detail");
    const error = new ReceiptExtractionUnavailableError({ cause });

    expect(error.code).toBe("OCR_PROVIDER_UNAVAILABLE");
    expect(error.name).toBe("ReceiptExtractionUnavailableError");
    expect(error.cause).toBe(cause);
    expect(error.stack).toContain("ReceiptExtractionUnavailableError");
  });
});
