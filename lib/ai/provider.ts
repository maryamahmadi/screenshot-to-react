import type { AIProvider } from "./types";
import { createMockProvider } from "./mock";
import { createAnthropicProvider } from "./anthropic";

/**
 * Returns the real Anthropic provider when ANTHROPIC_API_KEY is set, otherwise
 * the deterministic mock provider. This single switch is how the app runs for
 * free in mock mode and later flips to real Claude with no other code changes.
 */
export function getProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropicProvider();
  }
  return createMockProvider();
}
