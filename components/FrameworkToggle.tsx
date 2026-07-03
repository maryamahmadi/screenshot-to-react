"use client";

import type { Framework } from "@/lib/ai/types";

const OPTIONS: { id: Framework; label: string }[] = [
  { id: "react-tailwind", label: "Tailwind" },
  { id: "react", label: "Inline CSS" },
];

export interface FrameworkToggleProps {
  value: Framework;
  onChange: (value: Framework) => void;
  disabled?: boolean;
}

export function FrameworkToggle({
  value,
  onChange,
  disabled = false,
}: FrameworkToggleProps) {
  return (
    <div
      role="group"
      aria-label="Output framework"
      className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            value === o.id
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
