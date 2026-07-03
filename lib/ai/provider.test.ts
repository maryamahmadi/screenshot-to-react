import { describe, it, expect, afterEach } from "vitest";
import { getProvider } from "./provider";
import { mockComponent, createMockProvider } from "./mock";
import type { GenerateParams } from "./types";

const baseParams: GenerateParams = {
  image: { base64: "AAAA", mediaType: "image/png" },
  framework: "react-tailwind",
};

async function collect(iter: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const chunk of iter) out += chunk;
  return out;
}

describe("getProvider", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = original;
  });

  it("uses the mock provider when no API key is set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(getProvider().mode).toBe("mock");
  });

  it("uses the anthropic provider when an API key is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    expect(getProvider().mode).toBe("anthropic");
  });
});

describe("mock provider", () => {
  it("produces a self-contained App component", () => {
    const code = mockComponent(baseParams);
    expect(code).toContain("export default function App");
  });

  it("is deterministic for identical params", () => {
    expect(mockComponent(baseParams)).toBe(mockComponent(baseParams));
  });

  it("streams chunks that reassemble into the full component", async () => {
    const provider = createMockProvider();
    const streamed = await collect(provider.stream(baseParams));
    expect(streamed).toBe(mockComponent(baseParams));
  });

  it("stops immediately when the signal is already aborted", async () => {
    const provider = createMockProvider();
    const streamed = await collect(
      provider.stream({ ...baseParams, signal: AbortSignal.abort() }),
    );
    expect(streamed).toBe("");
  });
});
