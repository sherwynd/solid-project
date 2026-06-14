import sharp from "sharp";
import type {
  ImageProcessor,
  ProcessedImage,
} from "../../domain/interfaces/ImageProcessor.js";

const FORMATS = new Set(["jpeg", "png", "webp"]);
export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImageError";
  }
}

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
        throw new InvalidImageError(
          "Only valid JPEG, PNG, or WebP images are supported.",
        );
      const expected =
        metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
      if (declaredMimeType !== expected)
        throw new InvalidImageError(
          "The uploaded file content does not match its MIME type.",
        );
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
      if (error instanceof InvalidImageError) throw error;
      throw new InvalidImageError(
        "The uploaded file is not a readable receipt image.",
      );
    }
  }
}
