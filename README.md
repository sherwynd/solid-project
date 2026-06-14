# Malaysian Receipt Scanner API

Node.js, TypeScript, and Fastify backend for authenticated receipt images uploaded by an Expo React Native app. It validates OAuth 2.0 JWT access tokens, caches validated principals in Redis, normalizes images with Sharp, and extracts structured expenses with Google Document AI Expense Parser. Google credentials remain on the backend; the mobile app calls only this API.

## Architecture

`POST /api/v1/receipts/scan` flows through a Fastify authentication adapter and thin controller into `ScanReceipt`.

- `AuthenticateAccessToken` depends on `AccessTokenVerifier` and `AuthenticationCache` interfaces.
- JOSE/JWKS token validation and Redis are replaceable infrastructure adapters.
- `ScanReceipt` depends only on `ImageProcessor` and `ReceiptExtractor` interfaces.
- Sharp and Google Document AI are replaceable infrastructure adapters.
- Malaysian normalization, confidence review, and financial reconciliation live in domain code.

## OAuth 2.0 Setup

This service is an OAuth 2.0 **resource server**. It does not issue tokens or store passwords.

1. Register the Expo application as a public/native OAuth client with your identity provider.
2. Use Authorization Code Flow with PKCE in Expo. Do not place a client secret in the mobile app.
3. Register this backend as an API/resource with an audience such as `https://receipt-api.example.com`.
4. Create and grant the `receipts:scan` API scope.
5. Configure the issuer, API audience, and provider JWKS endpoint in `.env`.
6. Send the access token as `Authorization: Bearer <access-token>`.

The API accepts signed JWT access tokens using `RS256` or `ES256`, verifies issuer, audience, signature, expiry, subject, and required scopes, and returns `401` or `403` before reading the uploaded receipt when authorization fails. The verifier is replaceable if your provider uses opaque-token introspection instead.

## Redis Authentication Cache

Start Redis locally:

```bash
docker compose up -d redis
```

Set `REDIS_URL` and `AUTH_CACHE_TTL_SECONDS`. Redis keys contain only a SHA-256 hash of the bearer token, never the raw token. Cached principals are validated with Zod, and cache TTL is capped by the token expiry. Authentication falls back to direct JWKS verification during a temporary Redis failure.

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
  -H "Authorization: Bearer $ACCESS_TOKEN" \
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
await fetch(`${API_URL}/api/v1/receipts/scan`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
```

Never put an OAuth client secret, Google credentials, Redis credentials, or direct Document AI calls in the Expo application.
