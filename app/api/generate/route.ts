import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/ai/provider";
import { generateRequestSchema } from "@/lib/schema";
import { generateRateLimiter } from "@/lib/ratelimit";
import { sanitizeCode } from "@/lib/sanitize";

export const runtime = "nodejs";

/** Hard safety cap on generated output, independent of the model token limit. */
const MAX_OUTPUT_CHARS = 24_000;

function makeTitle(instruction?: string): string {
  const t = instruction?.trim();
  if (t) return t.length > 60 ? `${t.slice(0, 57)}...` : t;
  return "Untitled screenshot";
}

export async function POST(request: NextRequest) {
  // 1. Require an authenticated user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Per-user rate limit.
  const rl = generateRateLimiter.check(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  // 3. Validate the request body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { image, instruction, previousCode, framework } = parsed.data;

  const generationId = crypto.randomUUID();

  // 4. Persist the screenshot to storage (path is namespaced by user id, which
  //    RLS enforces). Optional so refinements without a new image still work.
  let imagePath: string | null = null;
  if (image) {
    const ext = image.mediaType.split("/")[1] ?? "png";
    imagePath = `${user.id}/${generationId}.${ext}`;
    const bytes = Buffer.from(image.base64, "base64");
    const { error: uploadError } = await supabase.storage
      .from("screenshots")
      .upload(imagePath, bytes, { contentType: image.mediaType });
    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to store screenshot" },
        { status: 500 },
      );
    }
  }

  // 5. Stream the generated code, accumulating it to persist on completion.
  //    A local AbortController lets us stop the model when the output cap is
  //    hit, while still honoring client-initiated cancellation.
  const provider = getProvider();
  const encoder = new TextEncoder();
  const ac = new AbortController();
  const onClientAbort = () => ac.abort();
  request.signal.addEventListener("abort", onClientAbort);

  let fullCode = "";
  let truncated = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of provider.stream({
          image,
          instruction,
          previousCode,
          framework,
          signal: ac.signal,
        })) {
          fullCode += chunk;
          controller.enqueue(encoder.encode(chunk));
          if (fullCode.length >= MAX_OUTPUT_CHARS) {
            truncated = true;
            fullCode = fullCode.slice(0, MAX_OUTPUT_CHARS);
            ac.abort();
            break;
          }
        }
      } catch (err) {
        // A cap-triggered abort is expected; surface anything else.
        if (!truncated) {
          request.signal.removeEventListener("abort", onClientAbort);
          controller.error(err);
          return;
        }
      }

      // Persist a completed generation. A client cancel (not our cap-abort)
      // leaves nothing saved. Store sanitized code (fences/prose stripped) so
      // history and share pages render a clean, compilable component.
      const cleanCode = sanitizeCode(fullCode);
      if (!request.signal.aborted && cleanCode) {
        await supabase.from("generations").insert({
          id: generationId,
          user_id: user.id,
          title: makeTitle(instruction),
          image_path: imagePath,
          code: cleanCode,
          framework,
        });
      }

      request.signal.removeEventListener("abort", onClientAbort);
      controller.close();
    },
    cancel() {
      request.signal.removeEventListener("abort", onClientAbort);
      ac.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Generation-Id": generationId,
      "X-Provider-Mode": provider.mode,
    },
  });
}
