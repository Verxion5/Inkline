import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Inkline" },
      { name: "description", content: "Chronological events, ages, outfits, injuries and power progression." },
      { property: "og:title", content: "Timeline — Inkline" },
      { property: "og:description", content: "Chronological events, ages, outfits, injuries and power progression." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Timeline" description="Chronological events, ages, outfits, injuries and power progression." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Timeline" description="Chronological events, ages, outfits, injuries and power progression." />
      <Panel>
        <div className="font-display text-lg">Timeline for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Timeline events: {project.timeline.length}.</p>
      </Panel>
    </div>
  );
}
