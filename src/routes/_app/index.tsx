import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Section, StatCard, EmptyState, Cover, Chip } from "@/components/app/kit";
import { useDB, useCurrentProject } from "@/lib/store";
import { NAV } from "@/lib/nav";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Inkline Manga Studio" },
      { name: "description", content: "Your Inkline studio dashboard: projects, story brain, art pipeline and export in one cinematic workspace." },
      { property: "og:title", content: "Dashboard — Inkline Manga Studio" },
      { property: "og:description", content: "Your Inkline studio dashboard: projects, story brain, art pipeline and export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { label: "Create project", to: "/projects/new", icon: "Plus", hint: "Start from a description" },
  { label: "Story Studio", to: "/story", icon: "BookOpen", hint: "Shape premise and arcs" },
  { label: "Generate with AI", to: "/command", icon: "Sparkles", hint: "Talk to the co-director" },
  { label: "Art Studio", to: "/art", icon: "Palette", hint: "Tune the visual direction" },
];

function Dashboard() {
  const db = useDB();
  const project = useCurrentProject();
  const chapters = project?.chapters.length ?? 0;
  const panels = project?.chapters.reduce((n, c) => n + c.scenes.reduce((m, s) => m + s.panels.length, 0), 0) ?? 0;
  const drawn = project?.chapters.reduce((n, c) => n + c.scenes.reduce((m, s) => m + s.panels.filter((p) => p.imageUrl).length, 0), 0) ?? 0;

  return (
    <div>
      <div className="hero-glow surface-card relative mb-8 overflow-hidden p-7 md:p-9">
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Chip tone="primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-glow" /> Creative OS
            </Chip>
            <h1 className="mt-4 font-display text-3xl leading-tight md:text-5xl">
              {project ? `Welcome back to ${project.title}` : "Welcome to Inkline"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {project?.logline || project?.premise || "Describe a series in plain language. Inkline builds the story brain, the cast, the world, the chapters and the artwork."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/projects/new" className="inline-flex items-center gap-2 rounded-lg violet-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                <Icons.Plus className="h-4 w-4" /> Create new project
              </Link>
              {project && (
                <Link to="/editor" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition hover:border-primary/60">
                  <Icons.PanelsTopLeft className="h-4 w-4" /> Continue editing
                </Link>
              )}
            </div>
          </div>
          <Cover seed={project?.id ?? "inkline"} label={project?.genre || "Original series"} className="min-h-[190px]" />
        </div>
      </div>

      <Section title="Quick actions">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK.map((q) => {
            const I = (Icons as unknown as Record<string, Icons.LucideIcon>)[q.icon] ?? Icons.Circle;
            return (
              <Link key={q.to} to={q.to} className="surface-card hover-lift p-5">
                <I className="h-5 w-5 text-primary-glow" />
                <div className="mt-3 font-medium">{q.label}</div>
                <div className="text-xs text-muted-foreground">{q.hint}</div>
              </Link>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={db.projects.length} hint="In this workspace" />
        <StatCard label="Chapters" value={chapters} hint={project ? project.title : "No project"} />
        <StatCard label="Panels planned" value={panels} />
        <StatCard label="Panels drawn" value={drawn} hint={panels ? `${Math.round((drawn / panels) * 100)}% complete` : "Nothing drawn yet"} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Section title="Recent projects" actions={<Link to="/projects" className="text-xs text-primary-glow hover:underline">View all</Link>}>
          {db.projects.length === 0 ? (
            <EmptyState
              icon={<Icons.FolderPlus className="h-5 w-5" />}
              title="No projects yet"
              description="Create your first series and Inkline will build its story brain, cast and world."
              action={<Link to="/projects/new" className="rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground">Create project</Link>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {db.projects.slice(0, 4).map((p) => (
                <Link key={p.id} to="/story" className="surface-card hover-lift flex gap-4 p-4">
                  <Cover seed={p.id} className="h-20 w-16 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.format === "manga" ? "Manga" : "Manhwa"} · {p.chapters.length} chapters</div>
                    <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.logline || p.premise || "No brief yet."}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Studio map" description="Every module, one click away">
          <Panel className="space-y-4">
            {NAV.filter((g) => g.title !== "Home").map((g) => (
              <div key={g.title}>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{g.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((i) => (
                    <Link key={i.to} to={i.to} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground">
                      {i.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </Panel>
        </Section>
      </div>
    </div>
  );
}
