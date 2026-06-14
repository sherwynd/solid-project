import type { FastifyReply, FastifyRequest } from "fastify";
import type { ScanReceipt } from "../../application/use-cases/ScanReceipt.js";
import { InvalidImageError } from "../../infrastructure/image/SharpImageProcessor.js";
import { ReceiptExtractionError } from "../../infrastructure/google/GoogleDocumentAiReceiptExtractor.js";

const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export class ReceiptController {
  constructor(private readonly scanReceipt: ScanReceipt) {}
  scan = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!request.isMultipart()) {
        await reply
          .code(415)
          .send({ error: "Content-Type must be multipart/form-data." });
        return;
      }
      const file = await request.file();
      if (!file) {
        await reply
          .code(400)
          .send({ error: "A receipt image is required in the file field." });
        return;
      }
      if (file.fieldname !== "file") {
        file.file.resume();
        await reply
          .code(400)
          .send({ error: "The receipt image must use the file field." });
        return;
      }
      if (!MIME_TYPES.has(file.mimetype)) {
        file.file.resume();
        await reply
          .code(415)
          .send({ error: "Only JPEG, PNG, or WebP images are supported." });
        return;
      }
      await reply.code(200).send(
        await this.scanReceipt.execute({
          buffer: await file.toBuffer(),
          mimeType: file.mimetype,
        }),
      );
    } catch (error) {
      if (error instanceof InvalidImageError) {
        await reply.code(422).send({ error: error.message });
        return;
      }
      if (error instanceof ReceiptExtractionError) {
        request.log.error({ err: error }, "Receipt extraction failed");
        await reply
          .code(502)
          .send({ error: "Receipt OCR provider is unavailable." });
        return;
      }
      if (
        error instanceof Error &&
        (error.name.includes("RequestFileTooLargeError") ||
          error.message.includes("fileSize"))
      ) {
        await reply
          .code(413)
          .send({ error: "Receipt image must not exceed 10 MB." });
        return;
      }
      throw error;
    }
  };
}
