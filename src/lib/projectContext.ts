import type { Project } from "./types";

/** Compact, id-bearing snapshot of the Story Genome used as AI context. */
export function projectContext(project: Project | undefined, opts: { withIds?: boolean } = {}): string {
  if (!project) return "";
  const id = (s: string) => (opts.withIds ? ` [${s}]` : "");
  const lines: string[] = [
    `Title: ${project.title}${id(project.id)}`,
    `Format: ${project.format}`,
    `Premise: ${project.premise}`,
    project.logline ? `Logline: ${project.logline}` : "",
    project.genre ? `Genre: ${project.genre}` : "",
    project.tone ? `Tone: ${project.tone}` : "",
    project.themes.length ? `Themes: ${project.themes.join(", ")}` : "",
    project.lore ? `Lore: ${project.lore}` : "",
    project.organizations.length ? `Organizations: ${project.organizations.join(", ")}` : "",
    project.items.length ? `Key items: ${project.items.join(", ")}` : "",
    project.rules.length ? `World rules: ${project.rules.join(", ")}` : "",
    project.continuityNotes ? `Continuity notes: ${project.continuityNotes}` : "",
  ];

  lines.push("Characters:");
  for (const c of project.characters) {
    const outfit = c.outfits.find((o) => o.id === c.activeOutfitId) ?? c.outfits[0];
    lines.push(
      `- ${c.name}${id(c.id)} | age ${c.age || "?"} | ${c.role} | ${c.appearance} | outfit: ${
        outfit ? outfit.description || outfit.name : "unspecified"
      } | powers: ${c.powers.join(", ") || "none"} | items: ${c.items.join(", ") || "none"} | state: ${
        c.changes.at(-1) ?? "baseline"
      }`,
    );
  }

  lines.push("Locations:");
  for (const l of project.locations) {
    lines.push(`- ${l.name}${id(l.id)} | ${l.description} | ${l.atmosphere} | ${l.lighting} ${l.weather}`);
  }

  lines.push("Chapters:");
  for (const ch of project.chapters) {
    lines.push(`- Ch.${ch.number} ${ch.title}${id(ch.id)}: ${ch.synopsis}`);
    for (const s of ch.scenes) {
      lines.push(`  · Scene "${s.title}"${id(s.id)}: ${s.summary} (${s.panels.length} panels)`);
      for (const p of s.panels) {
        lines.push(`    - panel${id(p.id)} ${p.shot}: ${p.description}`);
      }
    }
  }

  if (project.timeline.length) {
    lines.push("Timeline:");
    for (const e of project.timeline) lines.push(`- ${e.title}${id(e.id)}: ${e.description}`);
  }

  return lines.filter(Boolean).join("\n");
}
