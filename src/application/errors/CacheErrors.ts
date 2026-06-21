import { AppError } from "./AppError.js";

export class CacheNamespaceRequiredError extends AppError {
  constructor() {
    super("CACHE_NAMESPACE_REQUIRED", "Cache namespace is required.");
  }
}

export class CacheInvalidTtlError extends AppError {
  constructor() {
    super("CACHE_INVALID_TTL", "Cache TTL must be a positive integer.");
  }
}

export class CacheReadError extends AppError {
  constructor(options?: ErrorOptions) {
    super("CACHE_READ_FAILED", "Cache read failed.", options);
  }
}

export class CacheWriteError extends AppError {
  constructor(options?: ErrorOptions) {
    super("CACHE_WRITE_FAILED", "Cache write failed.", options);
  }
}

export class CacheDeleteError extends AppError {
  constructor(options?: ErrorOptions) {
    super("CACHE_DELETE_FAILED", "Cache delete failed.", options);
  }
}

export class CacheCloseError extends AppError {
  constructor(options?: ErrorOptions) {
    super("CACHE_CLOSE_FAILED", "Cache connection close failed.", options);
  }
}
