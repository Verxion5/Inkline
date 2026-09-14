import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/art")({
  head: () => ({
    meta: [
      { title: "Art Studio — Inkline" },
      { name: "description", content: "Original Style DNA, linework, shading, lighting and provider status." },
      { property: "og:title", content: "Art Studio — Inkline" },
      { property: "og:description", content: "Original Style DNA, linework, shading, lighting and provider status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Art Studio" description="Original Style DNA, linework, shading, lighting and provider status." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Art Studio" description="Original Style DNA, linework, shading, lighting and provider status." />
      <Panel>
        <div className="font-display text-lg">Art Studio for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Art direction.</p>
      </Panel>
    </div>
  );
}
