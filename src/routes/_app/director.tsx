import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/director")({
  head: () => ({
    meta: [
      { title: "Scene Director — Inkline" },
      { name: "description", content: "Plan shots, camera, cast placement and pacing before any art is generated." },
      { property: "og:title", content: "Scene Director — Inkline" },
      { property: "og:description", content: "Plan shots, camera, cast placement and pacing before any art is generated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Scene Director" description="Plan shots, camera, cast placement and pacing before any art is generated." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Scene Director" description="Plan shots, camera, cast placement and pacing before any art is generated." />
      <Panel>
        <div className="font-display text-lg">Scene Director for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Scene planning.</p>
      </Panel>
    </div>
  );
}
