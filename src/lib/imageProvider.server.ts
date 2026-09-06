/**
 * Provider adapter for image generation. Everything provider-specific
 * (model ids, body shape, how the avoidance list is delivered, aspect ratio)
 * is isolated here so the provider can be swapped without touching the
 * compiler or the UI.
 */
import type { Aspect, Format, QualityLevel } from "./artDirection";

export const IMAGES_ENDPOINT = "https://ai.gateway.lovable.dev/v1/images/generations";

export type ImageJob = {
  prompt: string;
  negative: string[];
  aspect: Aspect;
  format: Format;
  quality: QualityLevel;
  stream: boolean;
};

export type ProviderInfo = {
  provider: "lovable-ai";
  models: Record<QualityLevel, string>;
  visionModel: string;
};

const MODELS: Record<QualityLevel, string> = {
  draft: "google/gemini-3.1-flash-image",
  standard: "google/gemini-3-pro-image",
  high: "google/gemini-3-pro-image",
};

export const VISION_MODEL = "google/gemini-3.7-flash";

export function describeProvider(): ProviderInfo {
  return { provider: "lovable-ai", models: MODELS, visionModel: VISION_MODEL };
}

export function selectModel(quality: QualityLevel): string {
  return MODELS[quality] ?? MODELS.standard;
}

/**
 * Gemini image models take one prose instruction. They have no separate
 * negative-prompt field, so the avoidance list is delivered as an explicit
 * "Avoid" block, and the aspect ratio as both a config hint and prose.
 */
function formatGeminiPrompt(job: ImageJob): string {
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
    messages: [{ role: "user", content: formatGeminiPrompt(job) }],
    modalities: ["image", "text"],
    image_config: { aspect_ratio: job.aspect },
    ...(job.stream ? { stream: true } : {}),
  };
}
