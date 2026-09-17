import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip, Select } from "@/components/app/kit";
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
  return <ExportPage />;
}

function ExportPage() {
  const project = useCurrentProject()!;
  const [chId, setChId] = useState<string>(project.chapters[0]?.id ?? "");
  const [format, setFormat] = useState<"images" | "json">("images");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const chapter = project.chapters.find((c) => c.id === chId);
  const drawnPanels = chapter?.scenes.reduce((n, s) => n + s.panels.filter((p) => p.imageUrl).length, 0) ?? 0;
  const totalPanels = chapter?.scenes.reduce((n, s) => n + s.panels.length, 0) ?? 0;

  async function exportImages() {
    if (!chapter) return;
    setBusy(true);
    setDone(false);
    try {
      for (const scene of chapter.scenes) {
        for (const panel of scene.panels) {
          if (panel.imageUrl) {
            const a = document.createElement("a");
            a.href = panel.imageUrl;
            a.download = `${project.title.replace(/\s+/g, "_")}_ch${chapter.number}_${panel.id}.png`;
            a.click();
          }
        }
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Export & Publish" description="Export pages, chapters and vertical webtoon output." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="space-y-5">
          <div className="font-display text-lg">Export settings</div>
          <label className="block">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Chapter</div>
            <Select value={chId} onChange={(e) => setChId(e.target.value)}>
              {project.chapters.map((c) => <option key={c.id} value={c.id}>Ch.{c.number} — {c.title}</option>)}
            </Select>
          </label>
          <label className="block">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Format</div>
            <Select value={format} onChange={(e) => setFormat(e.target.value as "images" | "json")}>
              <option value="images">Panel images (PNG)</option>
              <option value="json">Project data (JSON)</option>
            </Select>
          </label>

          {chapter && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Chapter: {chapter.title}</div>
              <div>Scenes: {chapter.scenes.length}</div>
              <div>Drawn panels: {drawnPanels} / {totalPanels}</div>
              {drawnPanels < totalPanels && <div className="text-warning">⚠ {totalPanels - drawnPanels} panels have no artwork yet</div>}
            </div>
          )}

          <button
            onClick={() => (format === "images" ? exportImages() : exportJson())}
            disabled={busy || (!chapter && format === "images")}
            className="inline-flex items-center gap-2 rounded-lg violet-gradient px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-40"
          >
            {busy ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Download className="h-4 w-4" />}
            {format === "images" ? "Export panel images" : "Export project data"}
          </button>
          {done && <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">Export complete. Check your downloads folder.</div>}
        </Panel>

        <Panel className="space-y-4">
          <div className="font-display text-lg">Preview</div>
          {chapter && drawnPanels > 0 ? (
            <div className={`grid gap-2 ${project.format === "manga" ? "grid-cols-2" : "grid-cols-1"}`}>
              {chapter.scenes.flatMap((s) => s.panels.filter((p) => p.imageUrl).slice(0, 8)).map((p) => (
                <div key={p.id} className={`overflow-hidden rounded-lg border border-border ${project.format === "manga" ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
                  <img src={p.imageUrl} alt={p.description} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Icons.ImageIcon className="h-5 w-5" />} title="No artwork to preview" description="Generate panel art in the Scene Director or Comic Editor first." />
          )}
        </Panel>
      </div>
    </div>
  );
}
