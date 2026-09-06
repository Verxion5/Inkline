/**
 * Art direction core: settings, original presets, and the structured
 * prompt compiler. Provider-specific formatting lives in
 * imageProvider.server.ts — this module is provider-agnostic and client-safe.
 */

export type Format = "manga" | "webtoon";
export type QualityLevel = "draft" | "standard" | "high";

export const LINEWORK = ["hairline", "fine", "balanced", "bold", "brush-heavy"] as const;
export const SHADING = ["screentone", "cross-hatching", "cel shading", "soft gradient", "painterly"] as const;
export const COLOR = ["monochrome ink", "duotone", "muted limited palette", "vivid saturated", "pastel wash"] as const;
export const BACKGROUNDS = ["minimal", "suggestive", "detailed", "architectural"] as const;

export type Linework = (typeof LINEWORK)[number];
export type Shading = (typeof SHADING)[number];
export type ColorTreatment = (typeof COLOR)[number];
export type BackgroundDetail = (typeof BACKGROUNDS)[number];

export type ArtSettings = {
  format: Format;
  presetId: string;
  linework: Linework;
  shading: Shading;
  colorTreatment: ColorTreatment;
  backgroundDetail: BackgroundDetail;
  /** 0–100: camera drama, lens distortion, angle intensity */
  cinematicIntensity: number;
  /** 0–100: subtle → theatrical facial acting */
  facialExpressiveness: number;
  /** 0–100: stillness → explosive motion language */
  actionIntensity: number;
  quality: QualityLevel;
  /** run the vision review pass after each draw */
  review: boolean;
};

type PresetValues = Pick<
  ArtSettings,
  | "linework"
  | "shading"
  | "colorTreatment"
  | "backgroundDetail"
  | "cinematicIntensity"
  | "facialExpressiveness"
  | "actionIntensity"
>;

export type ArtPreset = {
  id: string;
  name: string;
  format: Format;
  blurb: string;
  /** Abstract visual signature — attributes only, never artist or franchise names. */
  signature: string;
  values: PresetValues;
};

export const PRESETS: ArtPreset[] = [
  {
    id: "ink-noir",
    name: "Ink Noir",
    format: "manga",
    blurb: "Heavy spotted blacks, razor rim light, rain-slick surfaces.",
    signature:
      "heavy spotted blacks carved with razor-thin rim light, wet surfaces catching hard highlights, dramatic screentone gradients, deliberate silhouettes",
    values: {
      linework: "bold",
      shading: "screentone",
      colorTreatment: "monochrome ink",
      backgroundDetail: "detailed",
      cinematicIntensity: 80,
      facialExpressiveness: 60,
      actionIntensity: 65,
    },
  },
  {
    id: "kinetic-line",
    name: "Kinetic Line",
    format: "manga",
    blurb: "Clean confident contours, bold foreshortening, impact energy.",
    signature:
      "clean confident contour lines with tapered brush endings, exaggerated foreshortening, focused speed lines and impact flashes, crisp white highlights on hair and eyes",
    values: {
      linework: "balanced",
      shading: "screentone",
      colorTreatment: "monochrome ink",
      backgroundDetail: "suggestive",
      cinematicIntensity: 70,
      facialExpressiveness: 80,
      actionIntensity: 95,
    },
  },
  {
    id: "quiet-hour",
    name: "Quiet Hour",
    format: "manga",
    blurb: "Delicate hatching, generous white space, observational stillness.",
    signature:
      "delicate cross-hatching for texture, generous white space, soft natural window light, calm observational framing, fine detail in hands and fabric",
    values: {
      linework: "fine",
      shading: "cross-hatching",
      colorTreatment: "monochrome ink",
      backgroundDetail: "detailed",
      cinematicIntensity: 40,
      facialExpressiveness: 70,
      actionIntensity: 20,
    },
  },
  {
    id: "cinema-color",
    name: "Cinema Color",
    format: "webtoon",
    blurb: "Controlled palette, single hard key light, atmospheric depth.",
    signature:
      "controlled cinematic palette with one dominant hue and one accent, soft cel shadows under a single hard key light, atmospheric haze separating depth planes, glossy specular highlights",
    values: {
      linework: "balanced",
      shading: "cel shading",
      colorTreatment: "muted limited palette",
      backgroundDetail: "detailed",
      cinematicIntensity: 85,
      facialExpressiveness: 70,
      actionIntensity: 60,
    },
  },
  {
    id: "neon-dusk",
    name: "Neon Dusk",
    format: "webtoon",
    blurb: "Neon practicals on deep-blue dusk, bloom, wet reflections.",
    signature:
      "neon practical lights against deep blue dusk, wet reflective streets, gentle bloom on light sources, cool-versus-warm color contrast, clean fine line art",
    values: {
      linework: "fine",
      shading: "soft gradient",
      colorTreatment: "vivid saturated",
      backgroundDetail: "architectural",
      cinematicIntensity: 90,
      facialExpressiveness: 65,
      actionIntensity: 70,
    },
  },
  {
    id: "storybook-wash",
    name: "Storybook Wash",
    format: "webtoon",
    blurb: "Soft washes, warm ambient light, gentle harmony.",
    signature:
      "soft translucent washes with visible edge pooling, warm ambient light, gentle color harmony, delicate line held back to essentials",
    values: {
      linework: "fine",
      shading: "painterly",
      colorTreatment: "pastel wash",
      backgroundDetail: "suggestive",
      cinematicIntensity: 50,
      facialExpressiveness: 80,
      actionIntensity: 30,
    },
  },
];

export function presetsFor(format: Format): ArtPreset[] {
  return PRESETS.filter((p) => p.format === format);
}

export function defaultSettings(format: Format = "manga"): ArtSettings {
  const preset = presetsFor(format)[0]!;
  return applyPreset(
    { format, presetId: preset.id, quality: "standard", review: true, ...preset.values },
    preset.id,
  );
}

export function applyPreset(settings: ArtSettings, presetId: string): ArtSettings {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return settings;
  return { ...settings, presetId: preset.id, format: preset.format, ...preset.values };
}

/* ------------------------------------------------------------------ */
/* Structured brief → compiled prompt                                   */
/* ------------------------------------------------------------------ */

export type CastRef = {
  name: string;
  /** canonical identity: age, build, face, hair, eyes, distinguishing marks */
  identity: string;
  outfit: string;
  props: string[];
  /** current physical/emotional state for continuity (injury, exhaustion, transformed) */
  state: string;
  pose: string;
  expression: string;
};

export type PanelBrief = {
  shot: string;
  cameraPosition: string;
  lens: string;
  focalSubject: string;
  depth: string;
  bubbleSpace: string;
  actionDirection: string;
  action: string;
  emotion: string;
  cast: CastRef[];
  environment: string;
  tone: string;
  continuity: string;
};

export type PromptSection = { label: string; text: string };
export type Aspect = "4:3" | "3:4" | "16:9" | "9:16" | "1:1";

export type CompiledArtPrompt = {
  sections: PromptSection[];
  /** positive prompt (sections joined) — provider-agnostic prose */
  prompt: string;
  /** avoidance list — the provider adapter decides how to deliver it */
  negative: string[];
  aspect: Aspect;
  format: Format;
  quality: QualityLevel;
};

export const NEGATIVE_BASE = [
  "malformed or asymmetric anatomy",
  "extra fingers, extra limbs, fused or warped hands",
  "duplicate or cloned characters",
  "faces that change between panels",
  "broken or inconsistent perspective",
  "any lettering, text, speech bubbles, captions, or sound-effect letters",
  "watermarks, signatures, or logos",
  "blurry, smeared, or low-detail rendering",
  "plastic 3D CGI or glossy render look",
  "photorealistic or photographic appearance",
  "random costume, hair color, or eye color changes",
  "cluttered composition with no clear focal point",
  "cropped-off heads or key body parts at frame edge",
  "flat lifeless expressions on emotional beats",
];

const NEGATIVE_MANGA = ["any color fills or tints", "gray digital airbrush gradients replacing screentone", "muddy midtones without solid blacks"];
const NEGATIVE_WEBTOON = ["muddy or desaturated mud-brown palette", "harsh unfiltered black shadows without color", "flat unlit backgrounds", "over-saturated neon on skin tones"];

function pick<T extends string>(v: number, low: T, mid: T, high: T): T {
  return v < 34 ? low : v < 67 ? mid : high;
}

function describeCast(cast: CastRef[]): string {
  return cast
    .map((c) => {
      const bits = [
        `${c.name}: ${c.identity}`.trim(),
        c.outfit ? `wearing ${c.outfit}` : "",
        c.props.length ? `carrying ${c.props.join(", ")}` : "",
        c.state ? `current state: ${c.state}` : "",
        c.pose ? `pose: ${c.pose}` : "",
        c.expression ? `expression: ${c.expression}` : "",
      ].filter(Boolean);
      return bits.join("; ");
    })
    .join(" || ");
}

export function compileArtPrompt(brief: PanelBrief, s: ArtSettings): CompiledArtPrompt {
  const preset = PRESETS.find((p) => p.id === s.presetId);
  const isManga = s.format === "manga";
  const sections: PromptSection[] = [];

  // 1. Medium
  sections.push({
    label: "Medium",
    text: isManga
      ? "Professional black-and-white manga panel: print-ready inked comic artwork, a single panel from a published chapter."
      : "Professional full-color webtoon (manhwa) panel: polished digital comic illustration composed for a vertical-scroll episode.",
  });

  // 2. Subject / identity
  if (brief.cast.length) {
    const count = brief.cast.length;
    sections.push({
      label: "Characters",
      text: `Exactly ${count} character${count > 1 ? "s" : ""} in frame. ${describeCast(brief.cast)}. Keep every character precisely on-model — same face structure, hair, eye color, build and outfit as described; do not redesign or add anyone.`,
    });
  } else {
    sections.push({ label: "Characters", text: "No characters in frame; the environment is the subject." });
  }

  // 3. Action
  const motion = pick(
    s.actionIntensity,
    "stillness held in the pose, weight settled, minimal motion cues",
    "clear readable movement with purposeful gesture",
    "explosive motion with strong foreshortening, secondary motion in hair and cloth, and focused motion cues",
  );
  sections.push({
    label: "Action",
    text: `${brief.action.trim().replace(/\.?$/, ".")} Action reads ${brief.actionDirection || "left to right"}; ${motion}.`,
  });

  // 4. Emotion
  const acting = pick(
    s.facialExpressiveness,
    "restrained, cinematic acting carried by the eyes and posture",
    "clearly legible expression with expressive eyes and brow",
    "theatrical, fully committed expression with exaggerated brow, mouth and eye shapes",
  );
  if (brief.emotion) sections.push({ label: "Emotion", text: `Emotional beat: ${brief.emotion}; ${acting}.` });

  // 5. Environment
  const bg = {
    minimal: "environment reduced to a few defining shapes and negative space",
    suggestive: "environment suggested with selective detail around the subject and simplified edges",
    detailed: "fully drawn environment with coherent architecture, props and surface texture",
    architectural: "meticulously constructed environment with accurate perspective grids and dense architectural detail",
  }[s.backgroundDetail];
  sections.push({
    label: "Environment",
    text: `${brief.environment ? `Setting: ${brief.environment}. ` : ""}${bg[0]!.toUpperCase()}${bg.slice(1)}.`,
  });

  // 6. Composition
  sections.push({
    label: "Composition",
    text: `${brief.shot}${brief.focalSubject ? `, focal subject: ${brief.focalSubject}` : ""}. ${
      brief.depth || "Clear foreground, midground and background separation"
    }. Leave uncluttered negative space ${brief.bubbleSpace || "in the upper part of the frame"} for dialogue to be placed later. Intentional framing with a single dominant read.`,
  });

  // 7. Camera & perspective
  const camera = pick(
    s.cinematicIntensity,
    "eye-level camera, natural perspective, composed like a quiet observational shot",
    "deliberate camera angle with confident perspective and a sense of depth",
    "dramatic camera angle, wide-lens perspective push, strong depth cues and vanishing points",
  );
  sections.push({
    label: "Camera",
    text: `${brief.cameraPosition || "camera at eye level"}, ${brief.lens || "natural lens"}; ${camera}.`,
  });

  // 8. Lighting
  sections.push({
    label: "Lighting",
    text: isManga
      ? "Lighting resolved into shape: one clear key light, solid spotted blacks in shadow, rim light to separate figures from background, crisp white highlights."
      : "Refined cinematic lighting: one clear key light with colored fill and ambient bounce, soft shadow edges on skin, depth haze toward the background, specular highlights on eyes and wet surfaces.",
  });

  // 9. Rendering & linework
  const line = {
    hairline: "hairline-thin uniform lines",
    fine: "fine controlled lines with subtle weight variation",
    balanced: "balanced line weight — heavier contours, lighter interior detail",
    bold: "bold confident contours with strong weight variation and tapered endings",
    "brush-heavy": "brush-heavy expressive strokes with dry-brush texture at the ends",
  }[s.linework];
  const shade = {
    screentone: "midtones rendered as halftone screentone dot patterns, shadows as solid black shapes",
    "cross-hatching": "shadows built from disciplined cross-hatching and feathered hatching",
    "cel shading": "clean two-step cel shading with hard-edged shadow shapes",
    "soft gradient": "smooth airbrushed gradients with soft shadow transitions",
    painterly: "painterly soft brushwork with visible blended strokes",
  }[s.shading];
  sections.push({
    label: "Rendering",
    text: `Hand-inked comic rendering: ${line}; ${shade}. Anatomically coherent figures with correct proportions, five-fingered hands, and consistent facial structure. ${
      preset ? `Visual signature: ${preset.signature}.` : ""
    }`,
  });

  // 10. Color treatment
  const color = isManga
    ? s.colorTreatment === "duotone"
      ? "Black-and-white ink with a single restrained spot color used only for emphasis."
      : "Strictly black and white with halftone grays. No color."
    : {
        "monochrome ink": "Near-monochrome palette with a single warm accent color.",
        duotone: "Two-color duotone palette with clean value separation.",
        "muted limited palette": "Muted limited palette of three to four harmonized hues.",
        "vivid saturated": "Vivid saturated palette with disciplined value structure so it stays readable.",
        "pastel wash": "Soft pastel palette with luminous washes.",
      }[s.colorTreatment];
  sections.push({ label: "Color", text: color });

  // 11. Tone & continuity
  if (brief.tone) sections.push({ label: "Tone", text: `Genre and tone: ${brief.tone}.` });
  if (brief.continuity) sections.push({ label: "Continuity", text: brief.continuity });

  // 12. Quality
  const detail = {
    draft: "clean readable draft finish",
    standard: "fully finished professional quality",
    high: "meticulously finished, gallery-grade professional quality with rich fine detail",
  }[s.quality];
  sections.push({
    label: "Quality",
    text: `Masterful ${detail}; sharp focus; clean confident inking; professional comic-panel readability at a glance. Original character and world design that does not imitate any living artist, studio, or existing franchise.`,
  });

  sections.push({
    label: "Text policy",
    text: "Absolutely no lettering, balloons, captions or sound-effect text anywhere in the image — dialogue and SFX are typeset later as overlays.",
  });

  const negative = [...NEGATIVE_BASE, ...(isManga ? NEGATIVE_MANGA : NEGATIVE_WEBTOON)];
  const aspect: Aspect = isManga ? "4:3" : "3:4";

  return {
    sections,
    prompt: sections.map((x) => `${x.label}: ${x.text}`).join("\n"),
    negative,
    aspect,
    format: s.format,
    quality: s.quality,
  };
}
