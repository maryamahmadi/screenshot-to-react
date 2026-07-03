import { describe, it, expect } from "vitest";
import { systemPrompt, userInstruction } from "./prompt";

describe("systemPrompt", () => {
  it("mentions Tailwind for the tailwind framework", () => {
    expect(systemPrompt("react-tailwind")).toMatch(/Tailwind/);
  });

  it("instructs inline styles (not Tailwind) for plain react", () => {
    const prompt = systemPrompt("react");
    expect(prompt).toMatch(/inline styles/i);
    expect(prompt).toMatch(/do NOT use Tailwind/i);
  });

  it("always requires a default App export", () => {
    expect(systemPrompt("react-tailwind")).toMatch(/default export/i);
  });
});

describe("userInstruction", () => {
  it("returns a default prompt when no instruction is given", () => {
    expect(userInstruction({ framework: "react-tailwind" })).toMatch(
      /Recreate this screenshot/i,
    );
  });

  it("embeds previous code and the change when refining", () => {
    const result = userInstruction({
      framework: "react-tailwind",
      previousCode: "export default function App() { return null; }",
      instruction: "make the button blue",
    });
    expect(result).toContain("export default function App() { return null; }");
    expect(result).toContain("make the button blue");
  });
});
