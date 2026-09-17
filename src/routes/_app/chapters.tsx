import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions, updateProject } from "@/lib/store";
import { newChapter, newScene, newEvent, uid } from "@/lib/factories";
import { generateChapter, type ChapterResult } from "@/lib/ai.functions";
import { projectContext } from "@/lib/projectContext";
import type { Chapter, Scene } from "@/lib/types";

export const Route = createFileRoute("/_app/chapters")({
  head: () => ({
    meta: [
      { title: "Chapter Studio — Inkline" },
      { name: "description", content: "Project, arc, chapter, scene and panel hierarchy." },
      { property: "og:title", content: "Chapter Studio — Inkline" },
      { property: "og:description", content: "Project, arc, chapter, scene and panel hierarchy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Chapter Studio" description="Project, arc, chapter, scene and panel hierarchy." /><ProjectGate /></>;
  return <ChapterStudio projectId={project.id} />;
}

function ChapterStudio({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { upsertChapter, removeChapter, updateScene, patch } = useProjectActions(projectId);
  const [selectedCh, setSelectedCh] = useState<string | null>(project?.chapters[0]?.id ?? null);
  const [aiMode, setAiMode] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [sceneCount, setSceneCount] = useState(3);
  const [panelsPerScene, setPanelsPerScene] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const runGen = useServerFn(generateChapter);

  const chapters = project?.chapters ?? [];
  const selected = chapters.find((c) => c.id === selectedCh) ?? null;

  function addChapter() {
    const ch = newChapter({ number: chapters.length + 1, title: `Chapter ${chapters.length + 1}` });
    upsertChapter(ch);
    setSelectedCh(ch.id);
  }

  function addScene() {
    if (!selected) return;
    const sc = newScene({ title: `Scene ${selected.scenes.length + 1}` });
    upsertChapter({ ...selected, scenes: [...selected.scenes, sc] });
  }

  async function generate() {
    if (!project) return;
    setError("");
    setBusy(true);
    try {
      const res = await runGen({ data: { context: projectContext(project), brief: aiBrief.trim(), sceneCount, panelsPerScene } });
      const ch = newChapter({
        number: chapters.length + 1,
        title: res.title,
        synopsis: res.synopsis,
        scenes: res.scenes.map((s) => {
          const sc = newScene({ title: s.title, summary: s.summary });
          const locName = s.location?.toLowerCase().trim();
          const loc = project.locations.find((l) => l.name.toLowerCase() === locName);
          if (loc) sc.locationId = loc.id;
          sc.panels = s.panels.map((p) => {
            const panel = {
              id: uid("pnl"),
              shot: p.shot,
              description: p.description,
              emotion: p.emotion,
              cameraNotes: p.cameraNotes,
              characterIds: p.characters
                .map((name) => project.characters.find((c) => c.name.toLowerCase() === name.toLowerCase().trim())?.id)
                .filter((x): x is string => Boolean(x)),
              locationId: loc?.id ?? null,
              dialogue: p.dialogue.map((d) => ({ id: uid("dlg"), speaker: d.speaker, text: d.text, kind: d.kind as never })),
              sfx: p.sfx,
              promptOverride: "",
              imageUrl: "",
              status: "planned" as const,
            };
            return panel;
          });
          return sc;
        }),
      });
      upsertChapter(ch);
      // Add timeline events
      if (res.events.length) {
        const events = res.events.map((e) => newEvent({ title: e.title, description: e.description, chapterId: ch.id }));
        patch((p) => ({ ...p, timeline: [...p.timeline, ...events] }));
      }
      setSelectedCh(ch.id);
      setAiMode(false);
      setAiBrief("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate chapter.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Chapter Studio"
        description="Project, arc, chapter, scene and panel hierarchy."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setAiMode(!aiMode)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/60">
              <Icons.Sparkles className="h-4 w-4" /> AI chapter
            </button>
            <button onClick={addChapter} className="inline-flex items-center gap-2 rounded-lg violet-gradient px-3 py-2 text-sm text-primary-foreground">
              <Icons.Plus className="h-4 w-4" /> Add chapter
            </button>
          </div>
        }
      />

      {aiMode && (
        <Panel className="mb-6 space-y-4">
          <Field label="Chapter brief" hint="Optional — leave blank to continue naturally.">
            <TextArea rows={3} autoFocus value={aiBrief} onChange={(e) => setAiBrief(e.target.value)} placeholder="The team arrives at the floating market. A mysterious merchant recognizes the protagonist…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Scenes"><TextInput type="number" min={1} max={6} value={sceneCount} onChange={(e) => setSceneCount(Number(e.target.value))} /></Field>
            <Field label="Panels per scene"><TextInput type="number" min={2} max={8} value={panelsPerScene} onChange={(e) => setPanelsPerScene(Number(e.target.value))} /></Field>
          </div>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => void generate()} className="rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">
              {busy ? "Directing chapter…" : "Generate chapter"}
            </button>
            <button onClick={() => setAiMode(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </Panel>
      )}

      {chapters.length === 0 ? (
        <EmptyState icon={<Icons.Layers className="h-5 w-5" />} title="No chapters yet" description="Add a chapter manually or let the AI director generate scenes and panels." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCh(c.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedCh === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Chip tone="muted">Ch.{c.number}</Chip>
                  <span className="truncate font-medium">{c.title}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{c.scenes.length} scenes · {c.scenes.reduce((n, s) => n + s.panels.length, 0)} panels</div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-5">
              <Panel className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg">Chapter details</div>
                  <button onClick={() => { if (confirm(`Delete "${selected.title}"?`)) { removeChapter(selected.id); setSelectedCh(null); } }} className="text-muted-foreground hover:text-destructive">
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Number"><TextInput type="number" value={selected.number} onChange={(e) => upsertChapter({ ...selected, number: Number(e.target.value) })} /></Field>
                  <Field label="Title"><TextInput value={selected.title} onChange={(e) => upsertChapter({ ...selected, title: e.target.value })} /></Field>
                </div>
                <Field label="Synopsis"><TextArea rows={3} value={selected.synopsis} onChange={(e) => upsertChapter({ ...selected, synopsis: e.target.value })} placeholder="What happens in this chapter?" /></Field>
              </Panel>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">Scenes</h3>
                  <button onClick={addScene} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/60">
                    <Icons.Plus className="h-3.5 w-3.5" /> Add scene
                  </button>
                </div>
                {selected.scenes.map((s, si) => (
                  <SceneCard key={s.id} scene={s} index={si} chapterId={selected.id} onUpdate={(fn) => updateScene(selected.id, s.id, fn)} projectId={projectId} />
                ))}
                {selected.scenes.length === 0 && <p className="text-sm text-muted-foreground">No scenes yet. Add one or generate a chapter with AI.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SceneCard({ scene, index, chapterId, onUpdate, projectId }: { scene: Scene; index: number; chapterId: string; onUpdate: (fn: (s: Scene) => Scene) => void; projectId: string }) {
  const project = useCurrentProject();
  const [expanded, setExpanded] = useState(false);
  const [locId, setLocId] = useState(scene.locationId);

  return (
    <Panel className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-left">
          <Icons.ChevronRight className={`h-4 w-4 transition ${expanded ? "rotate-90" : ""}`} />
          <span className="font-medium">Scene {index + 1}: {scene.title}</span>
        </button>
        <div className="flex items-center gap-2">
          <Chip tone="muted">{scene.panels.length} panels</Chip>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border pt-4">
          <Field label="Scene title"><TextInput value={scene.title} onChange={(e) => onUpdate((s) => ({ ...s, title: e.target.value }))} /></Field>
          <Field label="Summary"><TextArea rows={2} value={scene.summary} onChange={(e) => onUpdate((s) => ({ ...s, summary: e.target.value }))} /></Field>
          <Field label="Location">
            <select
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
              value={locId ?? ""}
              onChange={(e) => { setLocId(e.target.value || null); onUpdate((s) => ({ ...s, locationId: e.target.value || null })); }}
            >
              <option value="">— none —</option>
              {project?.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>

          {scene.panels.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Panels</div>
              {scene.panels.map((p, pi) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Chip tone="muted">P{pi + 1}</Chip>
                    <span className="text-xs text-muted-foreground">{p.shot}</span>
                    {p.imageUrl && <Chip tone="success">drawn</Chip>}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{p.description || "No description"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
