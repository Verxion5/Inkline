import type { Chapter, Panel, Project, Scene } from "./types";

export type ContinuityIssue = {
  level: "warning" | "info";
  message: string;
};

/** Practical, rule-based checks. These flag uncertainty — they do not guarantee consistency. */
export function checkPanel(project: Project, scene: Scene, panel: Panel): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];

  if (!panel.description.trim()) issues.push({ level: "warning", message: "Panel has no action description." });

  const locId = panel.locationId ?? scene.locationId;
  if (!locId) {
    issues.push({ level: "info", message: "No location linked — backgrounds may drift between panels." });
  } else if (!project.locations.some((l) => l.id === locId)) {
    issues.push({ level: "warning", message: "Linked location no longer exists in the World Bible." });
  }

  for (const id of panel.characterIds) {
    const c = project.characters.find((x) => x.id === id);
    if (!c) {
      issues.push({ level: "warning", message: "A referenced character was deleted from the Character Bible." });
      continue;
    }
    if (!c.appearance.trim())
      issues.push({ level: "warning", message: `${c.name} has no appearance description — art will be inconsistent.` });
    if (!c.outfits.length)
      issues.push({ level: "info", message: `${c.name} has no wardrobe entry for this chapter.` });
  }

  const speakers = panel.dialogue.map((d) => d.speaker.trim()).filter(Boolean);
  for (const sp of speakers) {
    const inPanel = panel.characterIds.some(
      (id) => project.characters.find((c) => c.id === id)?.name.toLowerCase() === sp.toLowerCase(),
    );
    const known = project.characters.some((c) => c.name.toLowerCase() === sp.toLowerCase());
    if (!known) issues.push({ level: "info", message: `Speaker "${sp}" is not in the Character Bible.` });
    else if (!inPanel) issues.push({ level: "warning", message: `"${sp}" speaks but is not cast in this panel.` });
  }

  if (!project.activeStyleId) issues.push({ level: "warning", message: "No active Style DNA selected." });

  return issues;
}

export function checkChapter(project: Project, chapter: Chapter): ContinuityIssue[] {
  const all: ContinuityIssue[] = [];
  for (const scene of chapter.scenes) for (const panel of scene.panels) all.push(...checkPanel(project, scene, panel));
  const seen = new Set<string>();
  return all.filter((i) => (seen.has(i.message) ? false : (seen.add(i.message), true)));
}

export function projectReadiness(project: Project): { score: number; missing: string[] } {
  const missing: string[] = [];
  if (!project.premise.trim()) missing.push("Premise");
  if (!project.characters.length) missing.push("At least one character");
  if (!project.locations.length) missing.push("At least one location");
  if (!project.styles.length) missing.push("A style preset");
  if (!project.chapters.length) missing.push("A chapter");
  const total = 5;
  return { score: Math.round(((total - missing.length) / total) * 100), missing };
}
