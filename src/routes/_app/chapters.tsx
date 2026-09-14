import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/chapters")({
  head: () => ({
    meta: [
      { title: "Chapter Studio — Inkline" },
      { name: "description", content: "Project, arc, chapter, scene and panel hierarchy." },
      { property: "og:title", content: "Chapter Studio — Inkline" },
      { property: "og:description", content: "Project, arc, chapter, scene and panel hierarchy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Chapter Studio" description="Project, arc, chapter, scene and panel hierarchy." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Chapter Studio" description="Project, arc, chapter, scene and panel hierarchy." />
      <Panel>
        <div className="font-display text-lg">Chapter Studio for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Chapters: {project.chapters.length}.</p>
      </Panel>
    </div>
  );
}
