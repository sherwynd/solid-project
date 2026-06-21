export interface Cache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface CacheCodec<T> {
  encode(value: T): string;
  decode(value: string): T | null;
}
