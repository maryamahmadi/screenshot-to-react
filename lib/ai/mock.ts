import type { AIProvider, GenerateParams } from "./types";

/**
 * Deterministic, dependency-free component templates. These are what the app
 * serves in free (mock) mode and what the tests assert against. Each is a
 * self-contained React + Tailwind component with a default export named `App`
 * and no external assets, so it renders reliably in Sandbox/Sandpack.
 */
const TEMPLATES: string[] = [
  `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-black/5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
          AM
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Ava Martin</h1>
        <p className="text-sm text-slate-500">Product Designer</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Crafting delightful interfaces and design systems for growing teams.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
            Follow
          </button>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
`,
  `export default function App() {
  const features = ["Unlimited projects", "Priority support", "Team analytics"];
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Pro
        </p>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-bold text-slate-900">$29</span>
          <span className="pb-1 text-sm text-slate-500">/month</span>
        </div>
        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
        <button className="mt-8 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
          Get started
        </button>
      </div>
    </div>
  );
}
`,
  `import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            placeholder="you@example.com"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            placeholder="••••••••"
          />
        </label>
        <button className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          Sign in
        </button>
      </form>
    </div>
  );
}
`,
];

/** Small stable string hash for deterministic template selection. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function mockComponent(params: GenerateParams): string {
  const seed = [
    params.instruction ?? "",
    params.previousCode ? "refine" : "initial",
    params.image?.base64.length ?? 0,
    params.framework,
  ].join("|");
  return TEMPLATES[hash(seed) % TEMPLATES.length];
}

/** Splits text into word-sized chunks to mimic token streaming. */
function chunks(text: string): string[] {
  return text.match(/\s+|\S+/g) ?? [text];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockProvider(): AIProvider {
  return {
    mode: "mock",
    async *stream(params: GenerateParams) {
      const code = mockComponent(params);
      const delay =
        process.env.NODE_ENV === "test"
          ? 0
          : Number(process.env.MOCK_STREAM_DELAY_MS ?? 18);

      for (const piece of chunks(code)) {
        if (params.signal?.aborted) return;
        if (delay > 0) await sleep(delay);
        yield piece;
      }
    },
  };
}
