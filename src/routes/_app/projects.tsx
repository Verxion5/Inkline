import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Cover, Chip, EmptyState, TextInput } from "@/components/app/kit";
import { useDB, setCurrentProject, deleteProject } from "@/lib/store";
import { projectReadiness } from "@/lib/continuity";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({
    meta: [
      { title: "My Projects — Inkline" },
      { name: "description", content: "Every series, one-shot and draft in your Inkline studio, with progress and quick access." },
      { property: "og:title", content: "My Projects — Inkline" },
      { property: "og:description", content: "Every series and draft in your Inkline studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const isChildRoute = useRouterState({ select: (s) => s.location.pathname !== "/projects" });
  if (isChildRoute) return <Outlet />;

  const db = useDB();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const list = db.projects.filter((p) => `${p.title} ${p.genre} ${p.premise}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        eyebrow="Home"
        title="My projects"
        description="Each project carries its own story brain, cast, world, chapters and art direction."
        actions={
          <Link to="/projects/new" className="inline-flex items-center gap-2 rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground">
            <Icons.Plus className="h-4 w-4" /> New project
          </Link>
        }
      />

      <div className="mb-6 max-w-sm">
        <TextInput placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {db.projects.length === 0 ? (
        <EmptyState
          icon={<Icons.FolderPlus className="h-5 w-5" />}
          title="Your studio is empty"
          description="Describe a series in your own words and Inkline builds the premise, cast, world and visual direction for you to edit."
          action={
            <Link to="/projects/new" className="rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground">
              Create your first project
            </Link>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState title="No matches" description={`Nothing matches "${q}".`} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const ready = projectReadiness(p);
            const active = db.currentId === p.id;
            return (
              <div key={p.id} className="surface-card hover-lift overflow-hidden">
                <Cover seed={p.id} className="h-32 w-full rounded-none border-0 border-b border-border" label={p.genre || "Original"} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg">{p.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {p.format === "manga" ? "Manga" : "Manhwa / webtoon"} · {p.chapters.length} chapters ·{" "}
                        {p.characters.length} cast
                      </div>
                    </div>
                    {active && <Chip tone="primary">Active</Chip>}
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.logline || p.premise || "No brief yet."}</p>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <span>Setup</span>
                      <span>{ready.score}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full violet-gradient" style={{ width: `${ready.score}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setCurrentProject(p.id);
                        void navigate({ to: "/story" });
                      }}
                      className="rounded-lg violet-gradient px-3 py-1.5 text-xs text-primary-foreground"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => {
                        setCurrentProject(p.id);
                        void navigate({ to: "/editor" });
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/60"
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"? This cannot be undone.`)) deleteProject(p.id);
                      }}
                      className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
