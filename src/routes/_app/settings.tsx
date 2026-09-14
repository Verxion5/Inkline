import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Inkline" },
      { name: "description", content: "Account, preferences, AI and export settings." },
      { property: "og:title", content: "Settings — Inkline" },
      { property: "og:description", content: "Account, preferences, AI and export settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Settings" description="Account, preferences, AI and export settings." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Settings" description="Account, preferences, AI and export settings." />
      <Panel>
        <div className="font-display text-lg">Settings for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Settings.</p>
      </Panel>
    </div>
  );
}
