import { ALLOWED_MEDIA_TYPES, MAX_IMAGE_BYTES } from "./schema";

export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

export interface ProcessedImage {
  /** Base64 payload without the `data:` URL prefix, ready for the API. */
  base64: string;
  mediaType: AllowedMediaType;
  /** Full data URL, convenient for an <img> thumbnail. */
  dataUrl: string;
  width: number;
  height: number;
  /** Byte length of the (possibly downscaled) encoded image. */
  bytes: number;
}

/** Longest edge (px) the screenshot is downscaled to before upload. */
export const DEFAULT_MAX_DIMENSION = 1280;

export function isAllowedMediaType(type: string): type is AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(type);
}

/** Splits a `data:<mediaType>;base64,<payload>` URL into its parts. */
export function splitDataUrl(dataUrl: string): {
  mediaType: string;
  base64: string;
} {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Unsupported image encoding.");
  }
  return { mediaType: match[1], base64: match[2] };
}

/** Approximate decoded byte length of a base64 string (ignores whitespace). */
export function base64ByteLength(base64: string): number {
  const clean = base64.replace(/=+$/, "");
  return Math.floor((clean.length * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Scales a width/height down so the longest edge is at most `maxDimension`. */
export function scaleToFit(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const ratio = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Loads an image file, downscales it so its longest edge is at most
 * `maxDimension`, and re-encodes it. PNGs stay lossless; other types are
 * encoded as WebP for a smaller payload. Browser-only (needs canvas).
 */
export async function processImageFile(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = scaleToFit(
      img.naturalWidth,
      img.naturalHeight,
      maxDimension,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process the image.");
    ctx.drawImage(img, 0, 0, width, height);

    const outputType: AllowedMediaType =
      file.type === "image/png" ? "image/png" : "image/webp";
    const dataUrl = canvas.toDataURL(outputType, 0.92);
    const { base64 } = splitDataUrl(dataUrl);
    const bytes = base64ByteLength(base64);

    if (bytes > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large even after resizing (max 4 MB).");
    }

    return { base64, mediaType: outputType, dataUrl, width, height, bytes };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Fetches a bundled example asset and runs it through the same pipeline. */
export async function loadExampleImage(
  url: string,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Promise<ProcessedImage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load example image.");
  const blob = await res.blob();
  const file = new File([blob], "example", {
    type: blob.type || "image/png",
  });
  return processImageFile(file, maxDimension);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}
