"use client";

import { useState } from "react";

export interface RefineChatProps {
  /** Instructions applied so far, oldest first. */
  history: string[];
  onSubmit: (instruction: string) => void;
  disabled?: boolean;
}

export function RefineChat({
  history,
  onSubmit,
  disabled = false,
}: RefineChatProps) {
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
  }

  return (
    <div className="flex flex-col gap-3">
      {history.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {history.map((h, i) => (
            <li
              key={i}
              className="self-start rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {h}
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="Describe a change, e.g. make the button blue"
          aria-label="Refinement instruction"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Refine
        </button>
      </form>
    </div>
  );
}
