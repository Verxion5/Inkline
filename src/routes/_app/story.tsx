import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/story")({
  head: () => ({
    meta: [
      { title: "Story Studio — Inkline" },
      { name: "description", content: "Premise, arcs, themes and key events for the active series." },
      { property: "og:title", content: "Story Studio — Inkline" },
      { property: "og:description", content: "Premise, arcs, themes and key events for the active series." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Story Studio" description="Premise, arcs, themes and key events for the active series." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Story Studio" description="Premise, arcs, themes and key events for the active series." />
      <Panel>
        <div className="font-display text-lg">Story Studio for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Story overview is being wired to the story brain.</p>
      </Panel>
    </div>
  );
}
