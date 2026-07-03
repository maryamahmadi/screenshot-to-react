import { describe, it, expect } from "vitest";
import {
  base64ByteLength,
  formatBytes,
  isAllowedMediaType,
  scaleToFit,
  splitDataUrl,
} from "./image";

describe("isAllowedMediaType", () => {
  it("accepts supported types", () => {
    expect(isAllowedMediaType("image/png")).toBe(true);
    expect(isAllowedMediaType("image/jpeg")).toBe(true);
    expect(isAllowedMediaType("image/webp")).toBe(true);
  });

  it("rejects unsupported types", () => {
    expect(isAllowedMediaType("image/gif")).toBe(false);
    expect(isAllowedMediaType("application/pdf")).toBe(false);
    expect(isAllowedMediaType("")).toBe(false);
  });
});

describe("splitDataUrl", () => {
  it("splits a base64 data URL into media type and payload", () => {
    const { mediaType, base64 } = splitDataUrl("data:image/png;base64,AAAB");
    expect(mediaType).toBe("image/png");
    expect(base64).toBe("AAAB");
  });

  it("throws on a non-data URL", () => {
    expect(() => splitDataUrl("https://example.com/x.png")).toThrow();
  });
});

describe("base64ByteLength", () => {
  it("computes decoded length ignoring padding", () => {
    // "AAAA" -> 3 bytes, "AAA=" -> 2 bytes
    expect(base64ByteLength("AAAA")).toBe(3);
    expect(base64ByteLength("AAA=")).toBe(2);
  });
});

describe("scaleToFit", () => {
  it("leaves small images untouched", () => {
    expect(scaleToFit(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it("scales the longest edge down to the max", () => {
    expect(scaleToFit(2560, 1440, 1280)).toEqual({ width: 1280, height: 720 });
  });

  it("scales portrait images by height", () => {
    expect(scaleToFit(1000, 2000, 1000)).toEqual({ width: 500, height: 1000 });
  });

  it("never rounds below 1px", () => {
    const { width, height } = scaleToFit(4000, 2, 100);
    expect(width).toBeGreaterThanOrEqual(1);
    expect(height).toBeGreaterThanOrEqual(1);
  });
});

describe("formatBytes", () => {
  it("formats across units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
