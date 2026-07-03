import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/ai/provider";
import { generateRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";

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

  // 2. Validate the request body.
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

  // 3. Persist the screenshot to storage (path is namespaced by user id, which
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

  // 4. Stream the generated code, accumulating it to persist on completion.
  const provider = getProvider();
  const encoder = new TextEncoder();
  let fullCode = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of provider.stream({
          image,
          instruction,
          previousCode,
          framework,
          signal: request.signal,
        })) {
          fullCode += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        controller.error(err);
        return;
      }

      // Persist only a complete, non-aborted generation.
      if (!request.signal.aborted && fullCode.trim()) {
        await supabase.from("generations").insert({
          id: generationId,
          user_id: user.id,
          title: makeTitle(instruction),
          image_path: imagePath,
          code: fullCode,
          framework,
        });
      }

      controller.close();
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
