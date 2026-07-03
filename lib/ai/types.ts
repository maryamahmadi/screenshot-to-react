export type Framework = "react-tailwind" | "react";

export interface GenerateParams {
  /** The screenshot to convert. Present for an initial generation. */
  image?: { base64: string; mediaType: string };
  /** Free-text instruction (initial hint, or a refinement request). */
  instruction?: string;
  /** Existing component code, when refining a previous generation. */
  previousCode?: string;
  framework: Framework;
  /** Aborts the stream when the client cancels. */
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly mode: "anthropic" | "mock";
  /** Streams the generated component code, chunk by chunk. */
  stream(params: GenerateParams): AsyncIterable<string>;
}
