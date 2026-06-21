import sharp from "sharp";
import type {
  ImageProcessor,
  ProcessedImage,
} from "../../domain/interfaces/ImageProcessor.js";
import {
  ImageFormatUnsupportedError,
  ImageMimeMismatchError,
  ImageUnreadableError,
} from "../../application/errors/ReceiptErrors.js";

const FORMATS = new Set(["jpeg", "png", "webp"]);
export class SharpImageProcessor implements ImageProcessor {
  async process(
    buffer: Buffer,
    declaredMimeType: string,
  ): Promise<ProcessedImage> {
    try {
      const image = sharp(buffer, {
        failOn: "error",
        limitInputPixels: 40_000_000,
      });
      const metadata = await image.metadata();
      if (!FORMATS.has(metadata.format))
        throw new ImageFormatUnsupportedError();
      const expected =
        metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
      if (declaredMimeType !== expected) throw new ImageMimeMismatchError();
      const processed = await image
        .rotate()
        .resize({
          width: 2400,
          height: 3200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      return { buffer: processed, mimeType: "image/jpeg" };
    } catch (error) {
      if (
        error instanceof ImageFormatUnsupportedError ||
        error instanceof ImageMimeMismatchError
      )
        throw error;
      throw new ImageUnreadableError({ cause: error });
    }
  }
}
