import { AppError } from "./AppError.js";

export class MultipartRequiredError extends AppError {
  constructor() {
    super(
      "UPLOAD_MULTIPART_REQUIRED",
      "Content-Type must be multipart/form-data.",
    );
  }
}

export class ReceiptFileRequiredError extends AppError {
  constructor() {
    super(
      "UPLOAD_FILE_REQUIRED",
      "A receipt image is required in the file field.",
    );
  }
}

export class ReceiptFileFieldInvalidError extends AppError {
  constructor() {
    super("UPLOAD_FIELD_INVALID", "The receipt image must use the file field.");
  }
}

export class UploadMediaTypeUnsupportedError extends AppError {
  constructor() {
    super(
      "UPLOAD_MEDIA_TYPE_UNSUPPORTED",
      "Only JPEG, PNG, or WebP images are supported.",
    );
  }
}

export class UploadFileTooLargeError extends AppError {
  constructor(options?: ErrorOptions) {
    super(
      "UPLOAD_FILE_TOO_LARGE",
      "Receipt image must not exceed 10 MB.",
      options,
    );
  }
}
