import { describe, expect, it } from "@jest/globals";
import sharp from "sharp";
import { SharpImageProcessor } from "../src/infrastructure/image/SharpImageProcessor.js";

describe("SharpImageProcessor", () => {
  it("classifies unreadable image content", async () => {
    const processor = new SharpImageProcessor();

    await expect(
      processor.process(Buffer.from("not-an-image"), "image/jpeg"),
    ).rejects.toMatchObject({ code: "IMAGE_UNREADABLE" });
  });

  it("classifies a declared MIME type that does not match image content", async () => {
    const processor = new SharpImageProcessor();
    const png = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: "white",
      },
    })
      .png()
      .toBuffer();

    await expect(processor.process(png, "image/jpeg")).rejects.toMatchObject({
      code: "IMAGE_MIME_MISMATCH",
    });
  });
});
