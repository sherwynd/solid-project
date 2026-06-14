import { describe, expect, it } from "@jest/globals";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { UnauthorizedError } from "../src/application/errors/AuthenticationErrors.js";
import { JoseAccessTokenVerifier } from "../src/infrastructure/oauth/JoseAccessTokenVerifier.js";

describe("JoseAccessTokenVerifier", () => {
  it("validates JWT signature, issuer, audience, expiry and scopes", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    const verifier = new JoseAccessTokenVerifier(createLocalJWKSet({ keys: [publicJwk] }), {
      issuer: "https://issuer.example.com/",
      audience: "receipt-api",
      jwksUrl: "https://issuer.example.com/jwks.json",
    });
    const token = await new SignJWT({ scope: "openid receipts:scan" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("user-123")
      .setIssuer("https://issuer.example.com/")
      .setAudience("receipt-api")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
    await expect(verifier.verify(token)).resolves.toMatchObject({
      subject: "user-123",
      scopes: ["openid", "receipts:scan"],
    });
  });

  it("rejects a token for a different audience", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    const verifier = new JoseAccessTokenVerifier(createLocalJWKSet({ keys: [publicJwk] }), {
      issuer: "https://issuer.example.com/",
      audience: "receipt-api",
      jwksUrl: "https://issuer.example.com/jwks.json",
    });
    const token = await new SignJWT({ scope: "receipts:scan" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("user-123")
      .setIssuer("https://issuer.example.com/")
      .setAudience("another-api")
      .setExpirationTime("5m")
      .sign(privateKey);
    await expect(verifier.verify(token)).rejects.toThrow(UnauthorizedError);
  });
});
