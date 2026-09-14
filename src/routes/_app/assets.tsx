import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/assets")({
  head: () => ({
    meta: [
      { title: "Asset Library — Inkline" },
      { name: "description", content: "Reusable characters, locations, outfits, props, panels and styles." },
      { property: "og:title", content: "Asset Library — Inkline" },
      { property: "og:description", content: "Reusable characters, locations, outfits, props, panels and styles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Asset Library" description="Reusable characters, locations, outfits, props, panels and styles." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Asset Library" description="Reusable characters, locations, outfits, props, panels and styles." />
      <Panel>
        <div className="font-display text-lg">Asset Library for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Assets.</p>
      </Panel>
    </div>
  );
}
