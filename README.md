# Screenshot → React

Turn a UI screenshot into a working React component. Drop in an image, watch
the code stream in token-by-token, preview it live, and refine it with natural
language — with accounts, history, and shareable links.

> **Live demo:** _add after deploy_ · **Access:** sign-ups are allow-listed for
> the live deployment (it runs against a real model). Runs fully in a free
> **mock mode** with no keys.

<!-- Add a screen recording / GIF here for the portfolio. -->

## Why this project

It's a compact but production-shaped example of putting an LLM in front of real
users — not just a prompt in a notebook. The interesting parts are the seams
around the model:

- **Provider abstraction (mock ↔ live).** A single `getProvider()` switch runs
  the app on a deterministic mock generator with **zero keys/cost**, or on real
  Claude when `ANTHROPIC_API_KEY` is set — no other code changes. This keeps
  tests fast, free, and deterministic while the same code path ships to prod.
- **Streaming UX.** Generated code streams to the client token-by-token with a
  live code view; the preview reveals automatically when generation completes.
- **Untrusted-model-output handling.** Model output is sanitized (markdown
  fences/prose stripped) before it's persisted or rendered, and the live preview
  is wrapped in an error boundary so an invalid component degrades gracefully
  instead of crashing the page.
- **Guardrails.** Zod-validated requests (image size/type), a per-user
  sliding-window rate limit, and a hard output-length cap on top of the model
  token limit.
- **Multimodal.** Screenshots are downscaled client-side and sent as image input
  to a vision-capable model.
- **AuthN/Z + persistence.** Supabase auth (email confirmation), Postgres with
  Row-Level Security, and Storage — each user only sees their own generations,
  while unlisted `/s/[id]` share links are public via a server-side admin client.

## Tech stack

- **Next.js 16** (App Router, React 19) + **Tailwind CSS v4**
- **Vercel AI SDK** + `@ai-sdk/anthropic` (Claude Sonnet 4.5) for streaming
- **@codesandbox/sandpack-react** for the live in-browser preview
- **Supabase** (Auth, Postgres + RLS, Storage) via `@supabase/ssr`
- **Zod** for request validation
- **Vitest** + React Testing Library and **Playwright** for tests, **GitHub
  Actions** for CI

## How it works

```
Screenshot ─▶ client downscale ─▶ /api/generate
                                     │  auth · rate limit · Zod validation
                                     │  store image (Storage, RLS)
                                     ▼
                              getProvider() ── mock | anthropic
                                     │  stream tokens ─▶ client (live code view)
                                     ▼
                          sanitize ─▶ persist generation (Postgres, RLS)
                                     ▼
                         Sandpack preview (Tailwind via CDN)
```

## Local development

Requires **Node ≥ 20.19** (a `.nvmrc` pins 22).

```bash
npm install
cp .env.example .env.local   # fill in Supabase values (see below)
npm run dev                  # http://localhost:3000
```

With no `ANTHROPIC_API_KEY`, the app runs in **mock mode** (deterministic
sample components, ignores screenshot contents). Add the key to switch to real
screenshot-to-code generation — no code changes needed.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Browser-safe publishable key |
| `SUPABASE_SECRET_KEY` | yes | Backend-only key (bypasses RLS for share pages) |
| `ANTHROPIC_API_KEY` | no | Set to enable live Claude output (else mock mode) |
| `ANTHROPIC_MODEL` | no | Model override (default `claude-sonnet-4-5`) |
| `SIGNUP_ALLOWLIST` | no | Comma-separated emails allowed to sign up (else open) |

The Postgres schema, RLS policies, and Storage bucket live in
[`supabase/schema.sql`](supabase/schema.sql).

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # Vitest unit/component
npm run test:e2e    # Playwright end-to-end (provisions test users, mock mode)
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit, and the full
authenticated E2E suite (login, generate, history, public share, and cross-user
RLS isolation) on every PR — all in mock mode, so it's deterministic and free.

## Deployment

Deploys to **Vercel**. Set the environment variables above in the Vercel
project. For a public live deployment, set `SIGNUP_ALLOWLIST` so only you can
create accounts, add a spend cap on the Anthropic key, and add the deployed
origin to the Supabase Auth redirect allow-list.
