import { Redis } from "ioredis";
import type { AuthenticationCache } from "../../domain/interfaces/AuthenticationCache.js";
import {
  authPrincipalSchema,
  type AuthPrincipal,
} from "../../domain/types/Auth.js";

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

export class RedisAuthenticationCache implements AuthenticationCache {
  constructor(
    private readonly client: RedisClient,
    private readonly keyPrefix = "receipt-api:auth:",
  ) {}

  static create(
    redisUrl: string,
    keyPrefix?: string,
  ): RedisAuthenticationCache {
    const client = new Redis(redisUrl, {
      connectTimeout: 2_000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on("error", () => undefined);
    return new RedisAuthenticationCache(client, keyPrefix);
  }

  async get(tokenHash: string): Promise<AuthPrincipal | null> {
    const key = this.key(tokenHash);
    const raw = await this.client.get(key);
    if (!raw) return null;
    let cached: unknown;
    try {
      cached = JSON.parse(raw) as unknown;
    } catch {
      await this.client.del(key);
      return null;
    }
    const parsed = authPrincipalSchema.safeParse(cached);
    if (!parsed.success) {
      await this.client.del(key);
      return null;
    }
    return parsed.data;
  }

  async set(
    tokenHash: string,
    principal: AuthPrincipal,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(
      this.key(tokenHash),
      JSON.stringify(principal),
      "EX",
      ttlSeconds,
    );
  }

  async delete(tokenHash: string): Promise<void> {
    await this.client.del(this.key(tokenHash));
  }

  async close(): Promise<void> {
    await this.client.quit();
  }

  private key(tokenHash: string): string {
    return `${this.keyPrefix}${tokenHash}`;
  }
}
