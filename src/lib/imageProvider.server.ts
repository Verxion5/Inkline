/**
 * Provider adapter for image generation. Everything provider-specific
 * (endpoint, model ids, body shape, how the avoidance list is delivered,
 * aspect ratio) is isolated here so the provider can be swapped without
 * touching the compiler or the UI.
 *
 * Any OpenAI-compatible images API works: `POST {AI_BASE_URL}/images/generations`.
 */
import type { Aspect, Format, QualityLevel } from "./artDirection";
import { aiBaseUrl, visionModel } from "./ai.server";

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
  return `${aiBaseUrl()}/images/generations`;
}

export function imageModel(): string {
  return process.env["AI_IMAGE_MODEL"]?.trim() || DEFAULT_IMAGE_MODEL;
}

/** Maps the panel's aspect ratio onto the provider's supported image sizes. */
export function imageSize(aspect: Aspect): string {
  const override = process.env["AI_IMAGE_SIZE"]?.trim();
  if (override) return override;
  if (aspect === "16:9" || aspect === "4:3") return "1536x1024";
  if (aspect === "9:16" || aspect === "3:4") return "1024x1536";
  return "1024x1024";
}

export function describeProvider(): ProviderInfo {
  const model = imageModel();
  return {
    provider: "openai-compatible",
    models: { draft: model, standard: model, high: model },
    visionModel: visionModel(),
  };
}

export function selectModel(_quality: QualityLevel): string {
  return imageModel();
}

/**
 * The images API takes one prose prompt. It has no separate negative-prompt
 * field, so the avoidance list is delivered as an explicit "Avoid" block, and
 * the aspect ratio as prose next to the size parameter.
 */
function formatImagePrompt(job: ImageJob): string {
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
    model: imageModel(),
    prompt: formatImagePrompt(job),
    n: 1,
    size: imageSize(job.aspect),
  };
}
