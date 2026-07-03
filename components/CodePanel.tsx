"use client";

import { useState } from "react";

export interface CodePanelProps {
  code: string;
  filename?: string;
  /** Shows a blinking caret while tokens are still arriving. */
  streaming?: boolean;
}

export function CodePanel({
  code,
  filename = "App.jsx",
  streaming = false,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); ignore.
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className="font-mono text-xs text-zinc-500">{filename}</span>
        <button
          type="button"
          onClick={copy}
          disabled={!code}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed">
        <code className="font-mono">
          {code}
          {streaming ? (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-zinc-400 align-middle" />
          ) : null}
        </code>
      </pre>
    </div>
  );
}
