import { createFileRoute } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip, Section } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/genome")({
  head: () => ({
    meta: [
      { title: "Story Genome — Inkline" },
      { name: "description", content: "The project brain linking characters, events, locations, chapters and objects." },
      { property: "og:title", content: "Story Genome — Inkline" },
      { property: "og:description", content: "The project brain linking characters, events, locations, chapters and objects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Story Genome" description="The project brain linking characters, events, locations, chapters and objects." /><ProjectGate /></>;
  return <GenomePage />;
}

function GenomePage() {
  const project = useCurrentProject()!;

  const entityGroups = [
    { label: "Characters", icon: "Users", items: project.characters.map((c) => ({ id: c.id, name: c.name, detail: c.role || c.age || "" })), to: "/characters" },
    { label: "Locations", icon: "MapPin", items: project.locations.map((l) => ({ id: l.id, name: l.name, detail: l.atmosphere || l.description || "" })), to: "/world" },
    { label: "Chapters", icon: "Layers", items: project.chapters.map((c) => ({ id: c.id, name: `Ch.${c.number} — ${c.title}`, detail: c.synopsis || `${c.scenes.length} scenes` })), to: "/chapters" },
    { label: "Timeline events", icon: "History", items: project.timeline.map((e) => ({ id: e.id, name: e.title || "Untitled", detail: e.description || "" })), to: "/timeline" },
    { label: "Style presets", icon: "Palette", items: project.styles.map((s) => ({ id: s.id, name: s.name, detail: `${s.lineWeight} · ${s.shading}` })), to: "/art" },
  ];

  const totalEntities = entityGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <PageHeader title="Story Genome" description="The project brain linking characters, events, locations, chapters and objects." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="text-center">
          <div className="font-display text-3xl">{project.characters.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">Characters</div>
        </Panel>
        <Panel className="text-center">
          <div className="font-display text-3xl">{project.locations.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">Locations</div>
        </Panel>
        <Panel className="text-center">
          <div className="font-display text-3xl">{project.chapters.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">Chapters</div>
        </Panel>
        <Panel className="text-center">
          <div className="font-display text-3xl">{totalEntities}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total entities</div>
        </Panel>
      </div>

      {totalEntities === 0 ? (
        <EmptyState icon={<Icons.Brain className="h-5 w-5" />} title="Genome is empty" description="Create characters, locations and chapters to build the project brain. The Story Genome keeps every system synchronized." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {entityGroups.map((g) => (
            <Section key={g.label} title={g.label}>
              {g.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="space-y-2">
                  {g.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.name}</div>
                        {item.detail && <div className="line-clamp-1 text-xs text-muted-foreground">{item.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          ))}
        </div>
      )}

      <Section title="Project metadata">
        <Panel className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Genre</div>
              <div className="mt-1">{project.genre || "—"}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Tone</div>
              <div className="mt-1">{project.tone || "—"}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Themes</div>
              <div className="mt-1 flex flex-wrap gap-1.5">{project.themes.length ? project.themes.map((t) => <Chip key={t} tone="primary">{t}</Chip>) : "—"}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Format</div>
              <div className="mt-1">{project.format === "manga" ? "Manga (B/W)" : "Manhwa (color)"}</div>
            </div>
          </div>
          {project.organizations.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Organizations</div>
              <div className="mt-1 flex flex-wrap gap-1.5">{project.organizations.map((o, i) => <Chip key={i} tone="muted">{o}</Chip>)}</div>
            </div>
          )}
          {project.rules.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">World rules</div>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {project.rules.map((r, i) => <li key={i}>· {r}</li>)}
              </ul>
            </div>
          )}
        </Panel>
      </Section>
    </div>
  );
}
