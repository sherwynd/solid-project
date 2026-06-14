# Malaysian Receipt Scanner API

Node.js, TypeScript, and Fastify backend for receipt images uploaded by an Expo React Native app. It normalizes images with Sharp and extracts structured expenses with Google Document AI Expense Parser. Google credentials remain on the backend; the mobile app calls only this API.

## Architecture

`POST /api/v1/receipts/scan` flows through a thin Fastify controller into `ScanReceipt`. The use case depends only on `ImageProcessor` and `ReceiptExtractor` interfaces. Sharp and Google Document AI are replaceable adapters. Malaysian normalization, confidence review, and financial reconciliation live in domain code.

## Google Cloud Setup

1. Use Node.js 22 or later and run `npm ci`.
2. Copy `.env.example` to `.env`.
3. Create a Google Cloud project with billing enabled and enable the Document AI API.
4. Create an **Expense Parser** processor and note its location and processor ID.
5. Set `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, and `GOOGLE_DOCUMENT_AI_PROCESSOR_ID`.
6. Grant the runtime service account the `Document AI API User` role.
7. For local development, use Application Default Credentials or set `GOOGLE_APPLICATION_CREDENTIALS` to an absolute service-account JSON path. Never commit that file.

Production should use workload identity or an attached service account rather than embedding credentials in the image or mobile app.

## Run and Test

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run coverage
```

```bash
curl -X POST http://localhost:3000/api/v1/receipts/scan \
  -F "file=@receipt.jpg;type=image/jpeg"
```

The multipart field must be named `file`. JPEG, PNG, and WebP are accepted up to 10 MB. Images are validated, EXIF-rotated, resized to fit 2400x3200, flattened, and compressed to JPEG before OCR.

The response includes merchant, ISO date, currency, subtotal, SST/tax, service charge, discount, rounding, total, line items, confidence scores, warnings, and `requiresReview`. `RM` normalizes to `MYR`; `DD/MM/YYYY` normalizes to `YYYY-MM-DD`.

## Expo Upload

```ts
const form = new FormData();
form.append("file", {
  uri: image.uri,
  name: "receipt.jpg",
  type: "image/jpeg",
} as unknown as Blob);
await fetch(`${API_URL}/api/v1/receipts/scan`, { method: "POST", body: form });
```

Never put Google credentials or direct Document AI calls in the Expo application.
