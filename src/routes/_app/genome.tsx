import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
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
  return (
    <div>
      <PageHeader title="Story Genome" description="The project brain linking characters, events, locations, chapters and objects." />
      <Panel>
        <div className="font-display text-lg">Story Genome for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Project memory graph.</p>
      </Panel>
    </div>
  );
}
