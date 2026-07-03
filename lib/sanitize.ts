/**
 * Normalizes raw model output into runnable component code.
 *
 * The mock provider already emits clean code, but a real LLM sometimes wraps
 * its answer in a markdown fence or adds a stray sentence despite instructions.
 * This extracts the fenced block when present and otherwise returns the trimmed
 * text, so the result can be dropped straight into Sandpack.
 */
export function sanitizeCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Prefer the first fenced code block if the model wrapped its output.
  const fenced = /```(?:[a-zA-Z0-9]+)?\r?\n([\s\S]*?)```/.exec(trimmed);
  const code = fenced ? fenced[1] : trimmed;

  return code.replace(/\r\n/g, "\n").trim();
}

/** True if the code exposes a default export (what the preview mounts). */
export function hasDefaultExport(code: string): boolean {
  return /export\s+default\b/.test(code);
}
