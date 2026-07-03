"use client";

import { useState } from "react";
import { loadExampleImage, type ProcessedImage } from "@/lib/image";

const EXAMPLES = [
  { src: "/examples/login.svg", label: "Login form" },
  { src: "/examples/pricing.svg", label: "Pricing card" },
  { src: "/examples/profile.svg", label: "Profile card" },
];

export interface ExampleScreenshotsProps {
  onPick: (image: ProcessedImage) => void;
  disabled?: boolean;
}

export function ExampleScreenshots({
  onPick,
  disabled = false,
}: ExampleScreenshotsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(src: string) {
    setLoading(src);
    setError(null);
    try {
      onPick(await loadExampleImage(src));
    } catch {
      setError("Could not load that example.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-zinc-500">Or try an example</span>
      <div className="grid grid-cols-3 gap-2">
        {EXAMPLES.map((e) => (
          <button
            key={e.src}
            type="button"
            disabled={disabled || loading !== null}
            onClick={() => pick(e.src)}
            className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 text-left transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.src}
              alt={e.label}
              className="h-16 w-full bg-white object-cover"
            />
            <span className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300">
              {loading === e.src ? "Loading…" : e.label}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
