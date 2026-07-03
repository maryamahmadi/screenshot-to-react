"use client";

import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

export interface PreviewPanelProps {
  code: string;
}

// Tailwind is provided at runtime via the Play CDN so utility classes in the
// generated component render without a build step inside the sandbox.
const INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export function PreviewPanel({ code }: PreviewPanelProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <SandpackProvider
        template="react"
        files={{
          "/App.js": { code },
          "/public/index.html": { code: INDEX_HTML, hidden: true },
        }}
        options={{ recompileMode: "delayed", recompileDelay: 300 }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton
          style={{ height: "100%", minHeight: "28rem" }}
        />
      </SandpackProvider>
    </div>
  );
}
