import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/continuity")({
  head: () => ({
    meta: [
      { title: "Continuity Center — Inkline" },
      { name: "description", content: "Detected continuity issues with severity and context." },
      { property: "og:title", content: "Continuity Center — Inkline" },
      { property: "og:description", content: "Detected continuity issues with severity and context." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Continuity Center" description="Detected continuity issues with severity and context." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Continuity Center" description="Detected continuity issues with severity and context." />
      <Panel>
        <div className="font-display text-lg">Continuity Center for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Continuity checks.</p>
      </Panel>
    </div>
  );
}
