"use client";

import { useRef, useState } from "react";
import { Dropzone } from "./Dropzone";
import { OutputTabs, PanelMessage } from "./OutputTabs";
import { ShareButton } from "./ShareButton";
import type { ProcessedImage } from "@/lib/image";

type Status = "idle" | "streaming" | "done" | "error";

export function GeneratorClient() {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isStreaming = status === "streaming";
  const hasOutput = status !== "idle" && (code.length > 0 || status === "error");

  async function generate() {
    if (!image || isStreaming) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("streaming");
    setError(null);
    setCode("");
    setMode(null);
    setGenerationId(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: { base64: image.base64, mediaType: image.mediaType },
          framework: "react-tailwind",
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const message = await res
          .json()
          .then((d) => d.error as string)
          .catch(() => "Generation failed.");
        throw new Error(message);
      }

      setMode(res.headers.get("X-Provider-Mode"));
      setGenerationId(res.headers.get("X-Generation-Id"));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setCode((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus(code ? "done" : "idle");
        return;
      }
      setError(err instanceof Error ? err.message : "Generation failed.");
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  function reset() {
    setImage(null);
    setCode("");
    setStatus("idle");
    setError(null);
    setMode(null);
    setGenerationId(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* Left: input */}
        <div className="flex flex-col gap-4">
          <Dropzone
            value={image}
            onSelect={setImage}
            onClear={reset}
            disabled={isStreaming}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={!image || isStreaming}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isStreaming ? "Generating…" : "Generate component"}
            </button>
            {isStreaming ? (
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            ) : null}
            {status === "done" && generationId ? (
              <ShareButton path={`/s/${generationId}`} />
            ) : null}
            {mode ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {mode} mode
              </span>
            ) : null}
          </div>
          {mode === "mock" ? (
            <p className="text-xs text-zinc-500">
              Mock mode returns one of a few sample components and ignores the
              screenshot contents. Add an Anthropic API key for real
              screenshot-to-code generation.
            </p>
          ) : null}
          {error ? (
            <div className="flex items-center gap-3">
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
              {image ? (
                <button
                  type="button"
                  onClick={generate}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right: output */}
        {hasOutput ? (
          <OutputTabs code={code} streaming={isStreaming} />
        ) : (
          <div className="flex min-h-[32rem] flex-col">
            <PanelMessage>
              Drop a screenshot and generate to see the result here.
            </PanelMessage>
          </div>
        )}
      </div>
    </div>
  );
}
