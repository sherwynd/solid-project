import { describe, expect, it, jest } from "@jest/globals";
import { AuthenticateAccessToken } from "../src/application/use-cases/AuthenticateAccessToken.js";
import { ForbiddenError } from "../src/application/errors/AuthenticationErrors.js";
import type { AccessTokenVerifier } from "../src/domain/interfaces/AccessTokenVerifier.js";
import type { AuthenticationCache } from "../src/domain/interfaces/AuthenticationCache.js";
import type { AuthPrincipal } from "../src/domain/types/Auth.js";

const principal: AuthPrincipal = {
  subject: "user-123",
  issuer: "https://issuer.example.com/",
  audience: ["receipt-api"],
  scopes: ["receipts:scan", "profile"],
  expiresAt: 1_300,
};

function cacheWith(value: AuthPrincipal | null): AuthenticationCache {
  return {
    get: jest.fn(async () => value),
    set: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
  };
}

describe("AuthenticateAccessToken", () => {
  it("returns a non-expired cached principal without verifying the token again", async () => {
    const cache = cacheWith(principal);
    const verifier: AccessTokenVerifier = { verify: jest.fn() };
    const useCase = new AuthenticateAccessToken(verifier, cache, {
      cacheTtlSeconds: 300,
      now: () => 1_000,
    });
    await expect(useCase.execute("token", ["receipts:scan"])).resolves.toEqual(
      principal,
    );
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it("verifies a cache miss and caps cache TTL at token expiry", async () => {
    const cache = cacheWith(null);
    const verifier: AccessTokenVerifier = {
      verify: jest.fn(async () => principal),
    };
    const useCase = new AuthenticateAccessToken(verifier, cache, {
      cacheTtlSeconds: 600,
      now: () => 1_000,
    });
    await useCase.execute("token", ["receipts:scan"]);
    expect(verifier.verify).toHaveBeenCalledWith("token");
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      principal,
      300,
    );
  });

  it("rejects a principal that lacks a required scope", async () => {
    const useCase = new AuthenticateAccessToken(
      { verify: jest.fn(async () => ({ ...principal, scopes: ["profile"] })) },
      cacheWith(null),
      { cacheTtlSeconds: 300, now: () => 1_000 },
    );
    await expect(useCase.execute("token", ["receipts:scan"])).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("bypasses Redis failure and verifies directly", async () => {
    const cache: AuthenticationCache = {
      get: jest.fn(async () => {
        throw new Error("redis unavailable");
      }),
      set: jest.fn(async () => {
        throw new Error("redis unavailable");
      }),
      delete: jest.fn(async () => undefined),
    };
    const verifier: AccessTokenVerifier = {
      verify: jest.fn(async () => principal),
    };
    const useCase = new AuthenticateAccessToken(verifier, cache, {
      cacheTtlSeconds: 300,
      now: () => 1_000,
    });
    await expect(useCase.execute("token", ["receipts:scan"])).resolves.toEqual(
      principal,
    );
  });
});
