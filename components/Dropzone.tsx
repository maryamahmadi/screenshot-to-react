"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  formatBytes,
  isAllowedMediaType,
  processImageFile,
  type ProcessedImage,
} from "@/lib/image";

export interface DropzoneProps {
  value: ProcessedImage | null;
  onSelect: (image: ProcessedImage) => void;
  onClear: () => void;
  disabled?: boolean;
  /** Injectable for tests; defaults to the canvas-based processor. */
  processFile?: (file: File) => Promise<ProcessedImage>;
  /** Listen for paste events on the window while mounted. Default true. */
  pasteFromClipboard?: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp";

export function Dropzone({
  value,
  onSelect,
  onClear,
  disabled = false,
  processFile = processImageFile,
  pasteFromClipboard = true,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const describedById = useId();

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setError(null);

      if (!isAllowedMediaType(file.type)) {
        setError("Unsupported file type. Use PNG, JPEG, or WebP.");
        return;
      }

      setIsProcessing(true);
      try {
        const processed = await processFile(file);
        onSelect(processed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read image.");
      } finally {
        setIsProcessing(false);
      }
    },
    [onSelect, processFile],
  );

  useEffect(() => {
    if (!pasteFromClipboard || disabled) return;
    function onPaste(event: ClipboardEvent) {
      const item = Array.from(event.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) {
        event.preventDefault();
        void handleFile(file);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile, pasteFromClipboard, disabled]);

  const busy = disabled || isProcessing;

  if (value) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.dataUrl}
            alt="Selected screenshot preview"
            className="h-20 w-20 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Screenshot ready
            </p>
            <p className="text-zinc-500">
              {value.width}×{value.height} · {formatBytes(value.bytes)} ·{" "}
              {value.mediaType.replace("image/", "").toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (busy) return;
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        aria-describedby={describedById}
        className={`flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors disabled:cursor-not-allowed ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
        }`}
      >
        <span className="text-base font-medium text-zinc-900 dark:text-zinc-100">
          {isProcessing ? "Processing…" : "Drop a screenshot here"}
        </span>
        <span id={describedById} className="text-sm text-zinc-500">
          or click to browse · paste from clipboard · PNG, JPEG, WebP up to 4 MB
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
