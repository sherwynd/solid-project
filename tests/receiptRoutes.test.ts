import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { ImageProcessor } from "../src/domain/interfaces/ImageProcessor.js";
import type { ReceiptExtractor } from "../src/domain/interfaces/ReceiptExtractor.js";
import { ReceiptExtractionError } from "../src/infrastructure/google/GoogleDocumentAiReceiptExtractor.js";
import { ForbiddenError } from "../src/application/errors/AuthenticationErrors.js";
import type { AccessTokenAuthenticator } from "../src/presentation/auth/createAuthenticationGuard.js";

const imageProcessor: ImageProcessor = {
  process: jest.fn(async (buffer) => ({ buffer, mimeType: "image/jpeg" })),
};
const receiptExtractor: ReceiptExtractor = {
  extract: jest.fn(async () => ({
    merchant: { text: "Store" },
    date: { text: "01/06/2026" },
    subtotal: { number: 10 },
    tax: { number: 0.6 },
    serviceCharge: { number: 0 },
    total: { number: 10.6 },
    currency: { text: "MYR" },
    lineItems: [],
  })),
};
const authenticator: AccessTokenAuthenticator = {
  execute: jest.fn(async () => ({
    subject: "user-123",
    issuer: "https://issuer.example.com/",
    audience: ["receipt-api"],
    scopes: ["receipts:scan"],
    expiresAt: 2_000_000_000,
  })),
};
const authHeader = { authorization: "Bearer valid-access-token" };
let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
  jest.clearAllMocks();
});

function multipart(
  filename: string,
  mimeType: string,
  content: Buffer,
): { body: Buffer; contentType: string } {
  const boundary = "test-boundary";
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      ),
      content,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}
describe("POST /api/v1/receipts/scan", () => {
  it("accepts a valid multipart receipt", async () => {
    app = await buildApp({ imageProcessor, receiptExtractor, authenticator });
    const upload = multipart("receipt.jpg", "image/jpeg", Buffer.from("image"));
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
      headers: { ...authHeader, "content-type": upload.contentType },
      payload: upload.body,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      receipt: { merchant: "Store", currency: "MYR" },
      requiresReview: false,
    });
  });
  it("rejects non-multipart requests", async () => {
    app = await buildApp({ imageProcessor, receiptExtractor, authenticator });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
      headers: { ...authHeader, "content-type": "application/json" },
      payload: "{}",
    });
    expect(response.statusCode).toBe(415);
  });
  it("rejects unsupported files", async () => {
    app = await buildApp({ imageProcessor, receiptExtractor, authenticator });
    const upload = multipart(
      "receipt.pdf",
      "application/pdf",
      Buffer.from("pdf"),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
      headers: { ...authHeader, "content-type": upload.contentType },
      payload: upload.body,
    });
    expect(response.statusCode).toBe(415);
  });
  it("rejects files larger than 10 MB", async () => {
    app = await buildApp({ imageProcessor, receiptExtractor, authenticator });
    const upload = multipart(
      "receipt.jpg",
      "image/jpeg",
      Buffer.alloc(10 * 1024 * 1024 + 1),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
      headers: { ...authHeader, "content-type": upload.contentType },
      payload: upload.body,
    });
    expect(response.statusCode).toBe(413);
  });
  it("maps Google failure to a safe 502", async () => {
    app = await buildApp({
      imageProcessor,
      receiptExtractor: {
        extract: jest.fn(async () => {
          throw new ReceiptExtractionError("provider failed");
        }),
      },
      authenticator,
    });
    const upload = multipart("receipt.png", "image/png", Buffer.from("image"));
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
      headers: { ...authHeader, "content-type": upload.contentType },
      payload: upload.body,
    });
    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: "Receipt OCR provider is unavailable.",
    });
  });
  it("rejects requests without a Bearer token", async () => {
    app = await buildApp({ imageProcessor, receiptExtractor, authenticator });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
    });
    expect(response.statusCode).toBe(401);
    expect(response.headers["www-authenticate"]).toContain("Bearer");
    expect(receiptExtractor.extract).not.toHaveBeenCalled();
  });
  it("rejects tokens without the required scope", async () => {
    const deniedAuthenticator: AccessTokenAuthenticator = {
      execute: jest.fn(async () => {
        throw new ForbiddenError();
      }),
    };
    app = await buildApp({
      imageProcessor,
      receiptExtractor,
      authenticator: deniedAuthenticator,
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/receipts/scan",
      headers: authHeader,
    });
    expect(response.statusCode).toBe(403);
    expect(response.headers["www-authenticate"]).toContain(
      "insufficient_scope",
    );
    expect(receiptExtractor.extract).not.toHaveBeenCalled();
  });
});
