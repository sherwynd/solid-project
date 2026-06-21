import { describe, expect, it } from "@jest/globals";
import { loadEnv } from "../src/config/env.js";

describe("loadEnv", () => {
  it("classifies invalid configuration without exposing validation details", () => {
    expect(() => loadEnv({})).toThrow(
      expect.objectContaining({
        code: "CONFIG_INVALID",
        message: "Application configuration is invalid.",
        cause: expect.any(Error),
      }),
    );
  });
});
