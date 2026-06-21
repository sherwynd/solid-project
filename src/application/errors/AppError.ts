export type ErrorCode =
  | "AUTH_TOKEN_REQUIRED"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_SCOPE_INSUFFICIENT"
  | "UPLOAD_MULTIPART_REQUIRED"
  | "UPLOAD_FILE_REQUIRED"
  | "UPLOAD_FIELD_INVALID"
  | "UPLOAD_MEDIA_TYPE_UNSUPPORTED"
  | "UPLOAD_FILE_TOO_LARGE"
  | "IMAGE_FORMAT_UNSUPPORTED"
  | "IMAGE_MIME_MISMATCH"
  | "IMAGE_UNREADABLE"
  | "OCR_PROVIDER_UNAVAILABLE"
  | "RECEIPT_RESULT_INVALID"
  | "CACHE_NAMESPACE_REQUIRED"
  | "CACHE_INVALID_TTL"
  | "CACHE_READ_FAILED"
  | "CACHE_WRITE_FAILED"
  | "CACHE_DELETE_FAILED"
  | "CACHE_CLOSE_FAILED"
  | "CONFIG_INVALID"
  | "SERVER_START_FAILED"
  | "ROUTE_NOT_FOUND";

export abstract class AppError extends Error {
  protected constructor(
    readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}
