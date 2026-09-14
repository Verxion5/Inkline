import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/export")({
  head: () => ({
    meta: [
      { title: "Export & Publish — Inkline" },
      { name: "description", content: "Export pages, chapters and vertical webtoon output." },
      { property: "og:title", content: "Export & Publish — Inkline" },
      { property: "og:description", content: "Export pages, chapters and vertical webtoon output." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Export & Publish" description="Export pages, chapters and vertical webtoon output." /><ProjectGate /></>;
  return (
    <div>
      <PageHeader title="Export & Publish" description="Export pages, chapters and vertical webtoon output." />
      <Panel>
        <div className="font-display text-lg">Export & Publish for {project.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">Export.</p>
      </Panel>
    </div>
  );
}
