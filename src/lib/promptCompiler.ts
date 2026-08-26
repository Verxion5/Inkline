import type { Panel, Project, Scene } from "./types";

const SAFETY =
  "Original character and world designs. No text, letters, speech bubbles, watermarks or signatures in the image. Do not imitate any living artist, studio signature style, or copyrighted franchise; the look must be an original synthesis of the abstract attributes listed above.";

/**
 * Style DNA is intentionally expressed as abstract visual attributes
 * (line, ink, color, shading, light, texture, rendering) rather than
 * artist or franchise names.
 */
export function compileStylePrompt(project: Project): string {
  const s = project.styles.find((x) => x.id === project.activeStyleId) ?? project.styles[0];
  if (!s) return "Original comic panel illustration.";
  const bits = [
    `Original ${project.format === "webtoon" ? "vertical-scroll manhwa" : "manga"} panel illustration`,
    `${s.lineWeight} line weight`,
    `${s.inkDensity} ink density`,
    `${s.colorTreatment}`,
    `${s.shading} shading`,
    `${s.lighting} lighting`,
    `${s.texture} texture`,
    `${s.backgroundDetail} backgrounds`,
    `${s.rendering} anatomy`,
    s.motionEffects !== "none" ? `${s.motionEffects} for motion` : "",
    `${s.panelEnergy} panel energy`,
    s.extraNotes,
  ].filter(Boolean);
  return bits.join(", ") + ".";
}

export function describeCharacterForPrompt(project: Project, id: string): string {
  const c = project.characters.find((x) => x.id === id);
  if (!c) return "";
  const outfit = c.outfits.find((o) => o.id === c.activeOutfitId) ?? c.outfits[0];
  return [
    `${c.name}`,
    c.age ? `age ${c.age}` : "",
    c.role,
    c.appearance,
    outfit ? `wearing ${outfit.description || outfit.name}` : "",
    c.items.length ? `carrying ${c.items.join(", ")}` : "",
    c.changes.length ? `current state: ${c.changes[c.changes.length - 1]}` : "",
  ]
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

export type CompiledPrompt = { prompt: string; sections: { label: string; text: string }[] };

export function compilePanelPrompt(project: Project, scene: Scene, panel: Panel): CompiledPrompt {
  if (panel.promptOverride.trim()) {
    return { prompt: panel.promptOverride.trim(), sections: [{ label: "Manual override", text: panel.promptOverride }] };
  }

  const style = compileStylePrompt(project);
  const cast = panel.characterIds.map((id) => describeCharacterForPrompt(project, id)).filter(Boolean);
  const place = describeLocationForPrompt(project, panel.locationId ?? scene.locationId);

  const sections: { label: string; text: string }[] = [
    { label: "Style DNA", text: style },
    { label: "Camera", text: `${panel.shot}${panel.cameraNotes ? `, ${panel.cameraNotes}` : ""}.` },
    { label: "Action", text: panel.description },
  ];
  if (cast.length) sections.push({ label: "Cast", text: cast.join(" | ") });
  if (place) sections.push({ label: "Location", text: place });
  if (panel.emotion) sections.push({ label: "Emotion", text: `Emotional register: ${panel.emotion}.` });
  if (project.tone || project.genre)
    sections.push({ label: "Tone", text: [project.genre, project.tone].filter(Boolean).join(", ") + "." });
  if (project.continuityNotes) sections.push({ label: "Continuity", text: project.continuityNotes });
  sections.push({ label: "Constraints", text: SAFETY });

  return { prompt: sections.map((s) => s.text).join(" "), sections };
}

/**
 * Turns a user-named existing style into safe, abstract attributes.
 * We never echo the requested name back into a generation prompt.
 */
export function sanitizeStyleRequest(input: string): { safe: boolean; note: string } {
  const named = /\b(studio\s+\w+|ghibli|marvel|dc|disney|pixar|naruto|one\s?piece|dragon\s?ball|jujutsu|solo\s+leveling|akira|miyazaki|araki|toriyama|kim\s+jung|artgerm)\b/i;
  if (named.test(input)) {
    return {
      safe: false,
      note: "Named styles and franchises are translated into abstract visual attributes (line, ink, color, shading, light) instead of being copied.",
    };
  }
  return { safe: true, note: "" };
}
