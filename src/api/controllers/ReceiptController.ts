import type { FastifyReply, FastifyRequest } from "fastify";
import type { ScanReceipt } from "../../application/use-cases/ScanReceipt.js";
import {
  MultipartRequiredError,
  ReceiptFileFieldInvalidError,
  ReceiptFileRequiredError,
  UploadFileTooLargeError,
  UploadMediaTypeUnsupportedError,
} from "../../application/errors/UploadErrors.js";

const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export class ReceiptController {
  constructor(private readonly scanReceipt: ScanReceipt) {}
  scan = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!request.isMultipart()) throw new MultipartRequiredError();
    const file = await readReceiptFile(request);
    if (!file) throw new ReceiptFileRequiredError();
    if (file.fieldname !== "file") {
      file.file.resume();
      throw new ReceiptFileFieldInvalidError();
    }
    if (!MIME_TYPES.has(file.mimetype)) {
      file.file.resume();
      throw new UploadMediaTypeUnsupportedError();
    }

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch (error) {
      if (isFileTooLargeError(error))
        throw new UploadFileTooLargeError({ cause: error });
      throw error;
    }
    await reply
      .code(200)
      .send(
        await this.scanReceipt.execute({ buffer, mimeType: file.mimetype }),
      );
  };
}

async function readReceiptFile(request: FastifyRequest) {
  try {
    return await request.file();
  } catch (error) {
    if (isFileTooLargeError(error))
      throw new UploadFileTooLargeError({ cause: error });
    throw error;
  }
}

function isFileTooLargeError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (("code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") ||
      error.name.includes("RequestFileTooLargeError") ||
      error.message.includes("fileSize"))
  );
}
