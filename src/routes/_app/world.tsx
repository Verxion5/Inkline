import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/world")({
  head: () => ({
    meta: [
      { title: "World Studio — Inkline" },
      { name: "description", content: "The World Bible: locations, factions, history, technology and world rules." },
      { property: "og:title", content: "World Studio — Inkline" },
      { property: "og:description", content: "The World Bible: locations, factions, history, technology and world rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="World Studio" description="The World Bible: locations, factions, history, technology and world rules." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="World Studio" description="The World Bible: locations, factions, history, technology and world rules." />
      <Panel>
        <div className="font-display text-lg">World Studio for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Locations: {project.locations.length}.</p>
      </Panel>
    </div>
  );
}
