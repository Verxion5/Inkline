import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/characters")({
  head: () => ({
    meta: [
      { title: "Character Studio — Inkline" },
      { name: "description", content: "The Character Bible: canonical appearance, outfits, powers and relationships." },
      { property: "og:title", content: "Character Studio — Inkline" },
      { property: "og:description", content: "The Character Bible: canonical appearance, outfits, powers and relationships." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Character Studio" description="The Character Bible: canonical appearance, outfits, powers and relationships." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Character Studio" description="The Character Bible: canonical appearance, outfits, powers and relationships." />
      <Panel>
        <div className="font-display text-lg">Character Studio for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Cast: {project.characters.length} characters.</p>
      </Panel>
    </div>
  );
}
