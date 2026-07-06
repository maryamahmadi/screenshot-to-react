"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CodePanel } from "./CodePanel";
import { sanitizeCode } from "@/lib/sanitize";

// Sandpack is client-only and heavy; load it lazily and skip SSR.
const PreviewPanel = dynamic(
  () => import("./PreviewPanel").then((m) => m.PreviewPanel),
  {
    ssr: false,
    loading: () => <PanelMessage>Loading preview…</PanelMessage>,
  },
);

type Tab = "preview" | "code";

export interface OutputTabsProps {
  /** Raw or sanitized component code; sanitized internally before preview. */
  code: string;
  /** True while tokens are still streaming in (disables preview). */
  streaming?: boolean;
  /** Which tab to show initially when not streaming. */
  defaultTab?: Tab;
}

export function OutputTabs({
  code,
  streaming = false,
  defaultTab = "preview",
}: OutputTabsProps) {
  const [tab, setTab] = useState<Tab>(streaming ? "code" : defaultTab);
  const [expanded, setExpanded] = useState(false);
  const cleanCode = useMemo(() => sanitizeCode(code), [code]);
  const wasStreaming = useRef(streaming);

  // Auto-reveal the preview once streaming finishes.
  useEffect(() => {
    if (wasStreaming.current && !streaming && cleanCode) setTab("preview");
    wasStreaming.current = streaming;
  }, [streaming, cleanCode]);

  // While expanded, close on Escape and lock background scroll.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [expanded]);

  const canPreview = !streaming && cleanCode.length > 0;

  return (
    <div
      className={
        expanded
          ? "fixed inset-0 z-50 flex flex-col gap-3 bg-white p-4 dark:bg-zinc-950"
          : "flex min-h-[32rem] flex-col gap-3"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Output view"
          className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
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

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse output" : "Expand output"}
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {expanded ? (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9L4 4m0 0v4m0-4h4m7 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m7-5l5 5m0 0v-4m0 4h-4"
                />
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              Expand
            </>
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "code" ? (
          <CodePanel code={cleanCode} streaming={streaming} />
        ) : canPreview ? (
          <PreviewPanel code={cleanCode} />
        ) : (
          <PanelMessage>
            {streaming
              ? "Preview appears when generation finishes…"
              : "Nothing to preview."}
          </PanelMessage>
        )}
      </div>
    </div>
  );
}

export function TabButton({
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

export function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
      {children}
    </div>
  );
}
