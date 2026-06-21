import type { CacheCodec } from "../../domain/interfaces/Cache.js";

export type CacheValueParser<T> = (value: unknown) => T | null;

export interface CacheValueSchema<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false };
}

export class JsonCacheCodec<T> implements CacheCodec<T> {
  constructor(private readonly parse: CacheValueParser<T>) {}

  encode(value: T): string {
    return JSON.stringify(value);
  }

  decode(value: string): T | null {
    try {
      return this.parse(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
}

export function createJsonCacheCodec<T>(
  schema: CacheValueSchema<T>,
): JsonCacheCodec<T> {
  return new JsonCacheCodec((value) => {
    const result = schema.safeParse(value);
    return result.success ? result.data : null;
  });
}
