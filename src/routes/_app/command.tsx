import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/command")({
  head: () => ({
    meta: [
      { title: "AI Command Center — Inkline" },
      { name: "description", content: "Natural-language commands that update your project state." },
      { property: "og:title", content: "AI Command Center — Inkline" },
      { property: "og:description", content: "Natural-language commands that update your project state." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="AI Command Center" description="Natural-language commands that update your project state." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="AI Command Center" description="Natural-language commands that update your project state." />
      <Panel>
        <div className="font-display text-lg">AI Command Center for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Conversational editing.</p>
      </Panel>
    </div>
  );
}
