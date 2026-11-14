/**
 * Provider adapter for image generation. Everything provider-specific
 * (model ids, body shape, how the avoidance list is delivered, size) is
 * isolated here so the provider can be swapped without touching the
 * compiler or the UI.
 *
 * The provider is any OpenAI-compatible images API:
 *   AI_API_KEY     — required; the provider key
 *   AI_BASE_URL    — optional; defaults to https://api.openai.com/v1
 *   AI_IMAGE_MODEL — optional; defaults to gpt-image-1
 */
import { apiBaseUrl, apiKey } from "./ai.server";
import type { Aspect, Format, QualityLevel } from "./artDirection";

const DEFAULT_IMAGE_MODEL = "gpt-image-1";

export type ImageJob = {
  prompt: string;
  negative: string[];
  aspect: Aspect;
  format: Format;
  quality: QualityLevel;
  stream: boolean;
};

export type ProviderInfo = {
  provider: "openai-compatible";
  models: Record<QualityLevel, string>;
  visionModel: string;
};

export function imagesEndpoint(): string {
  return `${apiBaseUrl()}/images/generations`;
}

/** Multimodal review model; falls back to the text model when unset. */
export const VISION_MODEL =
  process.env["AI_VISION_MODEL"]?.trim() || process.env["AI_TEXT_MODEL"]?.trim() || "gpt-4o-mini";

export function imageModel(): string {
  return process.env["AI_IMAGE_MODEL"]?.trim() || DEFAULT_IMAGE_MODEL;
}

const MODELS: Record<QualityLevel, string> = {
  draft: imageModel(),
  standard: imageModel(),
  high: imageModel(),
};

export function describeProvider(): ProviderInfo {
  return { provider: "openai-compatible", models: MODELS, visionModel: VISION_MODEL };
}

export function selectModel(_quality: QualityLevel): string {
  return imageModel();
}

export function hasImageKey(): boolean {
  return Boolean(apiKey());
}

/** The provider's quality knob maps onto the app's draft/standard/high levels. */
function selectQuality(quality: QualityLevel): string {
  return quality === "draft" ? "low" : quality === "high" ? "high" : "medium";
}

/** Canvas size per aspect ratio, using the sizes the images API accepts. */
const SIZES: Record<Aspect, string> = {
  "4:3": "1536x1024",
  "16:9": "1536x1024",
  "3:4": "1024x1536",
  "9:16": "1024x1536",
  "1:1": "1024x1024",
};

export function selectSize(aspect: Aspect): string {
  return SIZES[aspect] ?? "1024x1024";
}

/**
 * The images API takes one prose prompt and has no separate negative-prompt
 * field, so the avoidance list is delivered as an explicit "Avoid" block and
 * the aspect ratio as both prose and the requested canvas size.
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
    `Avoid: ${job.negative.join("; ")}.`,
  ].join("\n\n");
}

export function buildRequestBody(job: ImageJob): Record<string, unknown> {
  return {
    model: selectModel(job.quality),
    prompt: formatPrompt(job),
    size: selectSize(job.aspect),
    quality: selectQuality(job.quality),
    n: 1,
    // Servers that support streamed image events do so; others reply with JSON.
    ...(job.stream ? { stream: true } : {}),
  };
}
