import { Redis } from "ioredis";
import type { Cache, CacheCodec } from "../../domain/interfaces/Cache.js";
import {
  CacheCloseError,
  CacheDeleteError,
  CacheInvalidTtlError,
  CacheNamespaceRequiredError,
  CacheReadError,
  CacheWriteError,
} from "../../application/errors/CacheErrors.js";

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode: "EX",
    ttlSeconds: number,
  ): Promise<unknown>;
  del(key: string): Promise<number>;
  quit(): Promise<unknown>;
}

export class RedisCache<T> implements Cache<T> {
  constructor(
    private readonly client: RedisClient,
    private readonly namespace: string,
    private readonly codec: CacheCodec<T>,
    private readonly keyPrefix = "receipt-api",
  ) {
    if (!namespace.trim()) throw new CacheNamespaceRequiredError();
  }

  async get(key: string): Promise<T | null> {
    try {
      const namespacedKey = this.key(key);
      const raw = await this.client.get(namespacedKey);
      if (raw === null) return null;

      const decoded = this.codec.decode(raw);
      if (decoded === null) await this.client.del(namespacedKey);
      return decoded;
    } catch (error) {
      throw new CacheReadError({ cause: error });
    }
  }

  async set(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0)
      throw new CacheInvalidTtlError();

    try {
      await this.client.set(
        this.key(key),
        this.codec.encode(value),
        "EX",
        ttlSeconds,
      );
    } catch (error) {
      throw new CacheWriteError({ cause: error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.key(key));
    } catch (error) {
      throw new CacheDeleteError({ cause: error });
    }
  }

  private key(key: string): string {
    return `${this.keyPrefix}:${this.namespace}:${key}`;
  }
}

export class RedisCacheConnection {
  private constructor(private readonly client: RedisClient) {}

  static create(redisUrl: string): RedisCacheConnection {
    const client = new Redis(redisUrl, {
      connectTimeout: 2_000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on("error", () => undefined);
    return new RedisCacheConnection(client);
  }

  createCache<T>(namespace: string, codec: CacheCodec<T>): RedisCache<T> {
    return new RedisCache(this.client, namespace, codec);
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      throw new CacheCloseError({ cause: error });
    }
  }
}
