export interface ProcessedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
}
export interface ImageProcessor {
  process(buffer: Buffer, declaredMimeType: string): Promise<ProcessedImage>;
}
