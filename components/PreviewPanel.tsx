"use client";

import React from "react";
import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

export interface PreviewPanelProps {
  code: string;
}

// Tailwind's Play CDN, injected into the preview iframe via Sandpack's
// externalResources so utility classes render without a build step. Injecting
// it through a custom index.html is unreliable with the react template.
const TAILWIND_CDN = "https://cdn.tailwindcss.com";

/**
 * Sandpack can throw while trying to render a bundler/syntax error for
 * incomplete or invalid generated code. Without a boundary that error bubbles
 * up and crashes the whole route, so we contain it and point users to the code.
 */
class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          This component couldn&apos;t be previewed (it may be incomplete or have
          a syntax error). You can still view and copy it from the Code tab.
        </div>
      );
    }
    return this.props.children;
  }
}

export function PreviewPanel({ code }: PreviewPanelProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Key by code so a new generation resets the boundary and remounts. */}
      <PreviewErrorBoundary key={code}>
        <SandpackProvider
          template="react"
          files={{ "/App.js": { code } }}
          options={{
            externalResources: [TAILWIND_CDN],
            recompileMode: "delayed",
            recompileDelay: 300,
          }}
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: "100%", minHeight: "28rem" }}
          />
        </SandpackProvider>
      </PreviewErrorBoundary>
    </div>
  );
}
