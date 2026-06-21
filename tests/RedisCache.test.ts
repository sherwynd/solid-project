import { describe, expect, it } from "@jest/globals";
import { z } from "zod";
import {
  createJsonCacheCodec,
  type JsonCacheCodec,
} from "../src/infrastructure/cache/JsonCacheCodec.js";
import {
  RedisCache,
  type RedisClient,
} from "../src/infrastructure/redis/RedisCache.js";

class FakeRedis implements RedisClient {
  readonly values = new Map<string, string>();
  lastSet: { key: string; ttl: number } | null = null;
  readFailure: Error | null = null;

  async get(key: string): Promise<string | null> {
    if (this.readFailure) throw this.readFailure;
    return this.values.get(key) ?? null;
  }

  async set(
    key: string,
    value: string,
    _mode: "EX",
    ttlSeconds: number,
  ): Promise<unknown> {
    this.values.set(key, value);
    this.lastSet = { key, ttl: ttlSeconds };
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.values.delete(key) ? 1 : 0;
  }

  async quit(): Promise<unknown> {
    return "OK";
  }
}

const cachedUserSchema = z.object({
  id: z.string(),
  roles: z.array(z.string()),
});
type CachedUser = z.infer<typeof cachedUserSchema>;

function userCodec(): JsonCacheCodec<CachedUser> {
  return createJsonCacheCodec(cachedUserSchema);
}

describe("RedisCache", () => {
  it("stores validated JSON in its namespace with a TTL", async () => {
    const redis = new FakeRedis();
    const cache = new RedisCache(redis, "users", userCodec());
    const user = { id: "user-1", roles: ["member"] };

    await cache.set("abc123", user, 120);

    expect(redis.lastSet).toEqual({
      key: "receipt-api:users:abc123",
      ttl: 120,
    });
    await expect(cache.get("abc123")).resolves.toEqual(user);
  });

  it("isolates values belonging to different cache purposes", async () => {
    const redis = new FakeRedis();
    const users = new RedisCache(redis, "users", userCodec());
    const sessions = new RedisCache(redis, "sessions", userCodec());

    await users.set("same-key", { id: "user-1", roles: [] }, 60);
    await sessions.set("same-key", { id: "session-1", roles: [] }, 60);

    await expect(users.get("same-key")).resolves.toMatchObject({
      id: "user-1",
    });
    await expect(sessions.get("same-key")).resolves.toMatchObject({
      id: "session-1",
    });
  });

  it.each([
    ["invalid JSON", "{not-json"],
    ["invalid data", JSON.stringify({ id: 123 })],
  ])("deletes %s instead of returning it", async (_description, value) => {
    const redis = new FakeRedis();
    redis.values.set("receipt-api:users:abc123", value);
    const cache = new RedisCache(redis, "users", userCodec());

    await expect(cache.get("abc123")).resolves.toBeNull();
    expect(redis.values.has("receipt-api:users:abc123")).toBe(false);
  });

  it("rejects non-positive TTL values", async () => {
    const cache = new RedisCache(new FakeRedis(), "users", userCodec());

    await expect(
      cache.set("abc123", { id: "user-1", roles: [] }, 0),
    ).rejects.toMatchObject({
      code: "CACHE_INVALID_TTL",
      message: "Cache TTL must be a positive integer.",
    });
  });

  it("requires a namespace", () => {
    expect(() => new RedisCache(new FakeRedis(), " ", userCodec())).toThrow(
      expect.objectContaining({ code: "CACHE_NAMESPACE_REQUIRED" }),
    );
  });

  it("classifies Redis read failures and preserves their cause", async () => {
    const redis = new FakeRedis();
    const cause = new Error("connection refused");
    redis.readFailure = cause;
    const cache = new RedisCache(redis, "users", userCodec());

    await expect(cache.get("abc123")).rejects.toMatchObject({
      code: "CACHE_READ_FAILED",
      cause,
    });
  });
});
