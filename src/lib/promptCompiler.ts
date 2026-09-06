import type { Panel, Project, Scene, StyleDNA } from "./types";
import {
  compileArtPrompt,
  defaultSettings,
  type ArtSettings,
  type BackgroundDetail,
  type CastRef,
  type ColorTreatment,
  type CompiledArtPrompt,
  type Linework,
  type Shading,
} from "./artDirection";

/**
 * Bridges the persistent project model (Style DNA, bibles, scenes) onto the
 * structured art compiler. Style DNA stays attribute-based — never artist names.
 */
export function settingsFromStyle(project: Project, style: StyleDNA | undefined): ArtSettings {
  const base = defaultSettings(project.format);
  if (!style) return base;
  const energy = { "still and quiet": 20, measured: 45, kinetic: 75, explosive: 95 }[style.panelEnergy] ?? 60;
  const motion = { none: 15, "speed lines": 65, "impact bursts": 90, "motion blur": 70 }[style.motionEffects] ?? 50;
  const shading: Shading =
    style.shading === "flat" ? "cel shading" : ((style.shading as Shading) satisfies string) && (style.shading as Shading);
  const background: BackgroundDetail =
    style.backgroundDetail === "hyper-detailed architecture" ? "architectural" : (style.backgroundDetail as BackgroundDetail);
  return {
    ...base,
    linework: (style.lineWeight as Linework) || base.linework,
    shading: shading || base.shading,
    colorTreatment: (style.colorTreatment as ColorTreatment) || base.colorTreatment,
    backgroundDetail: background || base.backgroundDetail,
    cinematicIntensity: energy,
    actionIntensity: Math.round((energy + motion) / 2),
    facialExpressiveness: style.rendering === "stylized-simplified" ? 80 : 65,
  };
}

export function compileStylePrompt(project: Project): string {
  const s = project.styles.find((x) => x.id === project.activeStyleId) ?? project.styles[0];
  const settings = settingsFromStyle(project, s);
  return `${settings.format} · ${settings.linework} line · ${settings.shading} · ${settings.colorTreatment} · ${settings.backgroundDetail} backgrounds${
    s?.extraNotes ? ` · ${s.extraNotes}` : ""
  }`;
}

export function castRefFor(project: Project, id: string, panel?: Panel): CastRef | null {
  const c = project.characters.find((x) => x.id === id);
  if (!c) return null;
  const outfit = c.outfits.find((o) => o.id === c.activeOutfitId) ?? c.outfits[0];
  return {
    name: c.name,
    identity: [c.age ? `age ${c.age}` : "", c.role, c.appearance].filter(Boolean).join(", "),
    outfit: outfit ? outfit.description || outfit.name : "",
    props: c.items,
    state: c.changes.length ? c.changes[c.changes.length - 1]! : "",
    pose: panel?.cameraNotes ? "" : "",
    expression: panel?.emotion ?? "",
  };
}

export function describeCharacterForPrompt(project: Project, id: string): string {
  const ref = castRefFor(project, id);
  if (!ref) return "";
  return [ref.name, ref.identity, ref.outfit ? `wearing ${ref.outfit}` : "", ref.props.length ? `carrying ${ref.props.join(", ")}` : "", ref.state]
    .filter(Boolean)
    .join(" — ");
}

export function describeLocationForPrompt(project: Project, id: string | null): string {
  const l = project.locations.find((x) => x.id === id);
  if (!l) return "";
  return [l.name, l.description, l.architecture, l.atmosphere, l.lighting, l.weather, l.objects.join(", ")]
    .filter(Boolean)
    .join(" — ");
}

export type CompiledPrompt = CompiledArtPrompt;

export function compilePanelPrompt(project: Project, scene: Scene, panel: Panel): CompiledPrompt {
  const style = project.styles.find((x) => x.id === project.activeStyleId) ?? project.styles[0];
  const settings = settingsFromStyle(project, style);

  if (panel.promptOverride.trim()) {
    return {
      sections: [{ label: "Manual override", text: panel.promptOverride }],
      prompt: panel.promptOverride.trim(),
      negative: [],
      aspect: settings.format === "manga" ? "4:3" : "3:4",
      format: settings.format,
      quality: settings.quality,
    };
  }

  const cast = panel.characterIds.map((id) => castRefFor(project, id, panel)).filter((x): x is CastRef => Boolean(x));

  return compileArtPrompt(
    {
      shot: panel.shot,
      cameraPosition: panel.cameraNotes,
      lens: "",
      focalSubject: cast[0]?.name ?? "",
      depth: "",
      bubbleSpace: "",
      actionDirection: "",
      action: panel.description,
      emotion: panel.emotion,
      cast,
      environment: describeLocationForPrompt(project, panel.locationId ?? scene.locationId),
      tone: [project.genre, project.tone].filter(Boolean).join(", "),
      continuity: [project.continuityNotes, style?.extraNotes].filter(Boolean).join(" "),
    },
    settings,
  );
}

/**
 * Turns a user-named existing style into safe, abstract attributes.
 * We never echo the requested name back into a generation prompt.
 */
export function sanitizeStyleRequest(input: string): { safe: boolean; note: string } {
  const named =
    /\b(studio\s+\w+|ghibli|marvel|dc|disney|pixar|naruto|one\s?piece|dragon\s?ball|jujutsu|solo\s+leveling|akira|miyazaki|araki|toriyama|kim\s+jung|artgerm)\b/i;
  if (named.test(input)) {
    return {
      safe: false,
      note: "Named styles and franchises are translated into abstract visual attributes (line, ink, color, shading, light) instead of being copied.",
    };
  }
  return { safe: true, note: "" };
}
