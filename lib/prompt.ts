import type { Framework, GenerateParams } from "./ai/types";

/** System prompt instructing the model how to convert a screenshot to code. */
export function systemPrompt(framework: Framework): string {
  const styling =
    framework === "react-tailwind"
      ? "- Style everything with Tailwind CSS utility classes (Tailwind is available)."
      : "- Style everything with inline styles via the style prop. Do NOT use Tailwind classes.";

  return [
    "You are an expert frontend engineer.",
    "Convert the provided UI screenshot into a single, self-contained React component.",
    "",
    "Strict requirements:",
    "- Output ONLY code for one React function component. No prose, no explanations, no markdown fences.",
    "- The component MUST be the default export and named `App`.",
    "- Use only React (hooks are allowed). Do NOT import any third-party libraries.",
    "- Do NOT import external images, fonts, or assets. Use inline SVG, CSS, or placeholder text/blocks.",
    styling,
    "- Make it responsive and visually as close to the screenshot as possible.",
    "- The code must run as-is in a React 18+ sandbox.",
  ].join("\n");
}

/** Builds the user-facing text portion of the request. */
export function userInstruction(params: GenerateParams): string {
  if (params.previousCode) {
    return [
      "Here is the current component:",
      "```jsx",
      params.previousCode,
      "```",
      "",
      `Apply this change: ${params.instruction?.trim() || "improve the design"}.`,
      "Return the complete updated component code only.",
    ].join("\n");
  }

  return (
    params.instruction?.trim() ||
    "Recreate this screenshot as a React component."
  );
}
