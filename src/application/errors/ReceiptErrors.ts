import { AppError } from "./AppError.js";

export class ImageFormatUnsupportedError extends AppError {
  constructor() {
    super(
      "IMAGE_FORMAT_UNSUPPORTED",
      "Only valid JPEG, PNG, or WebP images are supported.",
    );
  }
}

export class ImageMimeMismatchError extends AppError {
  constructor() {
    super(
      "IMAGE_MIME_MISMATCH",
      "The uploaded file content does not match its MIME type.",
    );
  }
}

export class ImageUnreadableError extends AppError {
  constructor(options?: ErrorOptions) {
    super(
      "IMAGE_UNREADABLE",
      "The uploaded file is not a readable receipt image.",
      options,
    );
  }
}

export class ReceiptExtractionUnavailableError extends AppError {
  constructor(options?: ErrorOptions) {
    super(
      "OCR_PROVIDER_UNAVAILABLE",
      "Receipt OCR provider is unavailable.",
      options,
    );
  }
}

export class ReceiptResultInvalidError extends AppError {
  constructor(options?: ErrorOptions) {
    super(
      "RECEIPT_RESULT_INVALID",
      "The extracted receipt result is invalid.",
      options,
    );
  }
}
