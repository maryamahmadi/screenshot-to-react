import { describe, it, expect } from "vitest";
import { generateRequestSchema } from "./schema";

describe("generateRequestSchema", () => {
  it("accepts a valid image request and defaults the framework", () => {
    const result = generateRequestSchema.safeParse({
      image: { base64: "AAAA", mediaType: "image/png" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.framework).toBe("react-tailwind");
  });

  it("rejects a disallowed media type", () => {
    const result = generateRequestSchema.safeParse({
      image: { base64: "AAAA", mediaType: "image/gif" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized image", () => {
    const huge = "A".repeat(6 * 1024 * 1024);
    const result = generateRequestSchema.safeParse({
      image: { base64: huge, mediaType: "image/png" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a request with neither image nor instruction", () => {
    const result = generateRequestSchema.safeParse({
      framework: "react",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an instruction-only refinement", () => {
    const result = generateRequestSchema.safeParse({
      instruction: "make it dark mode",
      previousCode: "export default function App() { return null; }",
    });
    expect(result.success).toBe(true);
  });
});
