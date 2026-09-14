import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/editor")({
  head: () => ({
    meta: [
      { title: "Comic Editor — Inkline" },
      { name: "description", content: "Page and vertical canvas editor with editable dialogue, narration and SFX overlays." },
      { property: "og:title", content: "Comic Editor — Inkline" },
      { property: "og:description", content: "Page and vertical canvas editor with editable dialogue, narration and SFX overlays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Comic Editor" description="Page and vertical canvas editor with editable dialogue, narration and SFX overlays." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Comic Editor" description="Page and vertical canvas editor with editable dialogue, narration and SFX overlays." />
      <Panel>
        <div className="font-display text-lg">Comic Editor for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Editor canvas.</p>
      </Panel>
    </div>
  );
}
