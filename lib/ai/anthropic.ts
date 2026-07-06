import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type ModelMessage } from "ai";
import type { AIProvider, GenerateParams } from "./types";
import { systemPrompt, userInstruction } from "../prompt";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
// Generous cap so realistic components aren't truncated mid-JSX (which produces
// uncompilable code). The route still enforces a hard character cap on top.
const MAX_OUTPUT_TOKENS = 8000;

type UserContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mediaType: string };

function buildMessages(params: GenerateParams): ModelMessage[] {
  const content: UserContentPart[] = [
    { type: "text", text: userInstruction(params) },
  ];

  if (params.image) {
    content.push({
      type: "image",
      image: params.image.base64,
      mediaType: params.image.mediaType,
    });
  }

  return [{ role: "user", content }];
}

/** Real provider backed by Claude. Only used when ANTHROPIC_API_KEY is set. */
export function createAnthropicProvider(): AIProvider {
  return {
    mode: "anthropic",
    async *stream(params: GenerateParams) {
      const result = streamText({
        model: anthropic(MODEL),
        system: systemPrompt(params.framework),
        messages: buildMessages(params),
        abortSignal: params.signal,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });

      for await (const delta of result.textStream) {
        yield delta;
      }
    },
  };
}
