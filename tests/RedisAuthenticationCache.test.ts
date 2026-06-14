import { describe, expect, it } from "@jest/globals";
import { RedisAuthenticationCache, type RedisClient } from "../src/infrastructure/redis/RedisAuthenticationCache.js";

class FakeRedis implements RedisClient {
  readonly values = new Map<string, string>();
  lastSet: { key: string; ttl: number } | null = null;
  async get(key: string): Promise<string | null> { return this.values.get(key) ?? null; }
  async set(key: string, value: string, _mode: "EX", ttlSeconds: number): Promise<unknown> {
    this.values.set(key, value); this.lastSet = { key, ttl: ttlSeconds }; return "OK";
  }
  async del(key: string): Promise<number> { return this.values.delete(key) ? 1 : 0; }
  async quit(): Promise<unknown> { return "OK"; }
}

describe("RedisAuthenticationCache", () => {
  it("stores validated principal JSON under the hashed-token namespace with TTL", async () => {
    const redis = new FakeRedis();
    const cache = new RedisAuthenticationCache(redis);
    const principal = { subject: "user-1", issuer: "https://issuer.example.com/", audience: ["api"], scopes: ["receipts:scan"], expiresAt: 2_000_000_000 };
    await cache.set("abc123", principal, 120);
    expect(redis.lastSet).toEqual({ key: "receipt-api:auth:abc123", ttl: 120 });
    await expect(cache.get("abc123")).resolves.toEqual(principal);
  });

  it("deletes malformed cached authentication data", async () => {
    const redis = new FakeRedis();
    redis.values.set("receipt-api:auth:abc123", JSON.stringify({ subject: "missing-fields" }));
    const cache = new RedisAuthenticationCache(redis);
    await expect(cache.get("abc123")).resolves.toBeNull();
    expect(redis.values.has("receipt-api:auth:abc123")).toBe(false);
  });
});
