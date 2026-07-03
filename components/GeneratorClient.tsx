"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Dropzone } from "./Dropzone";
import { CodePanel } from "./CodePanel";
import { sanitizeCode } from "@/lib/sanitize";
import type { ProcessedImage } from "@/lib/image";

// Sandpack is client-only and heavy; load it lazily and skip SSR.
const PreviewPanel = dynamic(
  () => import("./PreviewPanel").then((m) => m.PreviewPanel),
  {
    ssr: false,
    loading: () => <PanelMessage>Loading preview…</PanelMessage>,
  },
);

type Status = "idle" | "streaming" | "done" | "error";
type Tab = "preview" | "code";

export function GeneratorClient() {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("code");
  const abortRef = useRef<AbortController | null>(null);

  const isStreaming = status === "streaming";
  const cleanCode = useMemo(() => sanitizeCode(code), [code]);
  const hasOutput = status !== "idle" && (code.length > 0 || status === "error");

  async function generate() {
    if (!image || isStreaming) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("streaming");
    setError(null);
    setCode("");
    setMode(null);
    setTab("code");

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

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setCode((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setStatus("done");
      setTab("preview");
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
          <div className="flex items-center gap-3">
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
            {mode ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {mode} mode
              </span>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>

        {/* Right: output */}
        <div className="flex min-h-[32rem] flex-col gap-3">
          <div
            role="tablist"
            aria-label="Output view"
            className="flex gap-1 self-start rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
          >
            <TabButton
              active={tab === "preview"}
              onClick={() => setTab("preview")}
            >
              Preview
            </TabButton>
            <TabButton active={tab === "code"} onClick={() => setTab("code")}>
              Code
            </TabButton>
          </div>

          <div className="min-h-0 flex-1">
            {!hasOutput ? (
              <PanelMessage>
                Drop a screenshot and generate to see the result here.
              </PanelMessage>
            ) : tab === "code" ? (
              <CodePanel code={cleanCode} streaming={isStreaming} />
            ) : status === "done" && cleanCode ? (
              <PreviewPanel code={cleanCode} />
            ) : (
              <PanelMessage>
                {isStreaming
                  ? "Preview appears when generation finishes…"
                  : "Nothing to preview."}
              </PanelMessage>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
      {children}
    </div>
  );
}
