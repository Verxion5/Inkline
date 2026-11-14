/**
 * Provider adapter for image generation against an OpenAI-compatible
 * `/images/generations` endpoint. Everything provider-specific (model id,
 * request body shape, aspect ratio -> pixel size, how the avoidance list is
 * delivered) is isolated here so the compiler and the UI stay untouched.
 */
import type { Aspect, Format, QualityLevel } from "./artDirection";

export type ImageJob = {
  prompt: string;
  negative: string[];
  aspect: Aspect;
  format: Format;
  quality: QualityLevel;
  stream: boolean;
};

const DEFAULT_IMAGE_MODEL = "gpt-image-1";

/** OpenAI image models accept a fixed set of sizes; map our comic aspects onto them. */
const SIZE_BY_ASPECT: Record<Aspect, string> = {
  "1:1": "1024x1024",
  "4:3": "1536x1024",
  "16:9": "1536x1024",
  "3:4": "1024x1536",
  "9:16": "1024x1536",
};

export function selectModel(): string {
  return process.env["AI_IMAGE_MODEL"] || DEFAULT_IMAGE_MODEL;
}

/**
 * The images endpoint takes one prose prompt with no separate negative field,
 * so the avoidance list is delivered as an explicit "Avoid" block and the
 * aspect ratio as prose alongside the size parameter.
 */
function formatPrompt(job: ImageJob): string {
  const aspectWords: Record<Aspect, string> = {
    "4:3": "landscape 4:3 comic panel",
    "3:4": "portrait 3:4 vertical comic panel",
    "16:9": "wide 16:9 cinematic panel",
    "9:16": "tall 9:16 vertical panel",
    "1:1": "square panel",
  };
  return [
    `Draw one ${aspectWords[job.aspect]} that fills the entire canvas edge to edge (no border, no page, no gutters).`,
    job.prompt,
    job.negative.length ? `Avoid: ${job.negative.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildRequestBody(job: ImageJob): Record<string, unknown> {
  return {
    model: selectModel(),
    prompt: formatPrompt(job),
    n: 1,
    size: SIZE_BY_ASPECT[job.aspect] ?? "1024x1024",
  };
}
