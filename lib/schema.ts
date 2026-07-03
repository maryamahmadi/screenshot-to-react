import { z } from "zod";

/** ~4 MB decoded; base64 inflates size by ~4/3. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_BASE64_LEN = Math.ceil((MAX_IMAGE_BYTES * 4) / 3);

export const ALLOWED_MEDIA_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const generateRequestSchema = z
  .object({
    image: z
      .object({
        base64: z
          .string()
          .min(1, "Image data is empty.")
          .max(MAX_BASE64_LEN, "Image is too large (max 4 MB)."),
        mediaType: z.enum(ALLOWED_MEDIA_TYPES),
      })
      .optional(),
    instruction: z.string().max(2000).optional(),
    previousCode: z.string().max(100_000).optional(),
    framework: z.enum(["react-tailwind", "react"]).default("react-tailwind"),
  })
  .refine((d) => d.image || d.instruction || d.previousCode, {
    message: "Provide an image or an instruction.",
  });

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
