import { describe, it, expect } from "vitest";
import { sanitizeCode, hasDefaultExport } from "./sanitize";

describe("sanitizeCode", () => {
  it("returns plain code unchanged (trimmed)", () => {
    const code = "export default function App() {\n  return null;\n}";
    expect(sanitizeCode(`  ${code}  `)).toBe(code);
  });

  it("extracts a fenced block with a language hint", () => {
    const raw = "```jsx\nexport default function App() {}\n```";
    expect(sanitizeCode(raw)).toBe("export default function App() {}");
  });

  it("extracts a fenced block without a language hint", () => {
    const raw = "```\nconst x = 1;\n```";
    expect(sanitizeCode(raw)).toBe("const x = 1;");
  });

  it("drops surrounding prose and keeps the fenced code", () => {
    const raw =
      "Sure! Here is your component:\n\n```tsx\nexport default function App() {}\n```\n\nHope that helps!";
    expect(sanitizeCode(raw)).toBe("export default function App() {}");
  });

  it("normalizes CRLF line endings", () => {
    expect(sanitizeCode("a\r\nb")).toBe("a\nb");
  });

  it("returns empty string for blank input", () => {
    expect(sanitizeCode("   \n  ")).toBe("");
  });
});

describe("hasDefaultExport", () => {
  it("detects a default export", () => {
    expect(hasDefaultExport("export default function App() {}")).toBe(true);
    expect(hasDefaultExport("const App = () => {};\nexport default App;")).toBe(
      true,
    );
  });

  it("returns false when absent", () => {
    expect(hasDefaultExport("export function App() {}")).toBe(false);
  });
});
