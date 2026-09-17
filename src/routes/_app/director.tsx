import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, EmptyState, Chip, Select } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { newPanel, uid, SHOT_TYPES } from "@/lib/factories";
import { compilePanelPrompt } from "@/lib/promptCompiler";
import { streamImage } from "@/lib/streamImage";
import { useServerFn } from "@tanstack/react-start";
import { reviewPanelArt } from "@/lib/artReview.functions";
import type { Chapter, Scene, Panel as PanelType, DialogueBlock, DialogueKind } from "@/lib/types";

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
  return <Director projectId={project.id} />;
}

function Director({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { updatePanel, updateScene } = useProjectActions(projectId);
  const [chId, setChId] = useState<string | null>(project?.chapters[0]?.id ?? null);
  const [scId, setScId] = useState<string | null>(null);

  const chapters = project?.chapters ?? [];
  const chapter = chapters.find((c) => c.id === chId) ?? null;
  const scenes = chapter?.scenes ?? [];
  const scene = scenes.find((s) => s.id === scId) ?? scenes[0] ?? null;

  if (chapters.length === 0) {
    return (
      <div>
        <PageHeader title="Scene Director" description="Plan shots, camera, cast placement and pacing before any art is generated." />
        <EmptyState icon={<Icons.Clapperboard className="h-5 w-5" />} title="No chapters to direct" description="Create a chapter in the Chapter Studio first, then come back to plan scenes and panels." />
      </div>
    );
  }

  function addPanel() {
    if (!chapter || !scene) return;
    const p = newPanel();
    updateScene(chapter.id, scene.id, (s) => ({ ...s, panels: [...s.panels, p] }));
  }

  return (
    <div>
      <PageHeader title="Scene Director" description="Plan shots, camera, cast placement and pacing before any art is generated." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={chId ?? ""} onChange={(e) => { setChId(e.target.value); setScId(null); }}>
          {chapters.map((c) => <option key={c.id} value={c.id}>Ch.{c.number} — {c.title}</option>)}
        </Select>
        {scenes.length > 0 && (
          <Select value={scene?.id ?? ""} onChange={(e) => setScId(e.target.value)}>
            {scenes.map((s, i) => <option key={s.id} value={s.id}>Scene {i + 1} — {s.title}</option>)}
          </Select>
        )}
      </div>

      {scene && chapter && (
        <div className="space-y-4">
          <Panel className="space-y-3">
            <Field label="Scene title"><TextInput value={scene.title} onChange={(e) => updateScene(chapter.id, scene.id, (s) => ({ ...s, title: e.target.value }))} /></Field>
            <Field label="Scene summary"><TextArea rows={2} value={scene.summary} onChange={(e) => updateScene(chapter.id, scene.id, (s) => ({ ...s, summary: e.target.value }))} /></Field>
          </Panel>

          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Panels ({scene.panels.length})</h3>
            <button onClick={addPanel} className="inline-flex items-center gap-1.5 rounded-lg violet-gradient px-3 py-1.5 text-xs text-primary-foreground">
              <Icons.Plus className="h-3.5 w-3.5" /> Add panel
            </button>
          </div>

          {scene.panels.length === 0 ? (
            <EmptyState icon={<Icons.Clapperboard className="h-5 w-5" />} title="No panels in this scene" description="Add panels to plan the shot-by-shot sequence." />
          ) : (
            <div className="space-y-4">
              {scene.panels.map((p, pi) => (
                <PanelEditor
                  key={p.id}
                  panel={p}
                  index={pi}
                  chapterId={chapter.id}
                  sceneId={scene.id}
                  onUpdate={(fn) => updatePanel(chapter.id, scene.id, p.id, fn)}
                  projectId={projectId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PanelEditor({ panel, index, chapterId, sceneId, onUpdate, projectId }: {
  panel: PanelType; index: number; chapterId: string; sceneId: string;
  onUpdate: (fn: (p: Panel) => Panel) => void; projectId: string;
}) {
  const project = useCurrentProject();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const reviewFn = useServerFn(reviewPanelArt);

  const chapter = project?.chapters.find((c) => c.id === chapterId);
  const scene = chapter?.scenes.find((s) => s.id === sceneId);

  function toggleChar(id: string) {
    onUpdate((p) => ({
      ...p,
      characterIds: p.characterIds.includes(id) ? p.characterIds.filter((x) => x !== id) : [...p.characterIds, id],
    }));
  }

  function addDialogue() {
    const d: DialogueBlock = { id: uid("dlg"), speaker: "", text: "", kind: "speech" };
    onUpdate((p) => ({ ...p, dialogue: [...p.dialogue, d] }));
  }

  function updateDialogue(id: string, patch: Partial<DialogueBlock>) {
    onUpdate((p) => ({ ...p, dialogue: p.dialogue.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }

  function removeDialogue(id: string) {
    onUpdate((p) => ({ ...p, dialogue: p.dialogue.filter((d) => d.id !== id) }));
  }

  async function generate() {
    if (!project || !scene) return;
    setGenerating(true);
    setGenError("");
    onUpdate((p) => ({ ...p, status: "drawing", error: undefined }));
    try {
      const compiled = compilePanelPrompt(project, scene, panel);
      let lastUrl = "";
      await streamImage("/api/generate-image", {
        prompt: compiled.prompt,
        negative: compiled.negative,
        aspect: compiled.aspect,
        format: compiled.format,
        quality: compiled.quality,
      }, (dataUrl, final) => {
        lastUrl = dataUrl;
        onUpdate((p) => ({ ...p, imageUrl: dataUrl, status: final ? "drawn" : "drawing" }));
      });
      if (lastUrl) {
        onUpdate((p) => ({ ...p, imageUrl: lastUrl, status: "drawn" }));
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
      onUpdate((p) => ({ ...p, status: "error", error: e instanceof Error ? e.message : "Generation failed" }));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip tone="muted">Panel {index + 1}</Chip>
          {panel.status === "drawn" && <Chip tone="success">drawn</Chip>}
          {panel.status === "drawing" && <Chip tone="warning">drawing…</Chip>}
          {panel.status === "error" && <Chip tone="danger">error</Chip>}
        </div>
        <button onClick={generate} disabled={generating} className="inline-flex items-center gap-1.5 rounded-lg violet-gradient px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-40">
          {generating ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.Palette className="h-3.5 w-3.5" />}
          {generating ? "Drawing…" : "Generate"}
        </button>
      </div>

      {panel.imageUrl && (
        <div className={`overflow-hidden rounded-lg border border-border ${project?.format === "manga" ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
          <img src={panel.imageUrl} alt={panel.description} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shot type">
          <Select value={panel.shot} onChange={(e) => onUpdate((p) => ({ ...p, shot: e.target.value }))}>
            {SHOT_TYPES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Location">
          <Select value={panel.locationId ?? ""} onChange={(e) => onUpdate((p) => ({ ...p, locationId: e.target.value || null }))}>
            <option value="">— scene default —</option>
            {project?.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Action description" hint="Directorial notes: posture, gesture, what's happening.">
        <TextArea rows={3} value={panel.description} onChange={(e) => onUpdate((p) => ({ ...p, description: e.target.value }))} placeholder="She draws the blade, rain streaming down her face…" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emotion"><TextInput value={panel.emotion} onChange={(e) => onUpdate((p) => ({ ...p, emotion: e.target.value }))} placeholder="determined, grief, cold fury" /></Field>
        <Field label="Camera notes"><TextInput value={panel.cameraNotes} onChange={(e) => onUpdate((p) => ({ ...p, cameraNotes: e.target.value }))} placeholder="low angle, wide lens" /></Field>
      </div>

      <Field label="SFX"><TextInput value={panel.sfx} onChange={(e) => onUpdate((p) => ({ ...p, sfx: e.target.value }))} placeholder="SHIIING" /></Field>

      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cast in panel</div>
        <div className="flex flex-wrap gap-2">
          {project?.characters.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleChar(c.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                panel.characterIds.includes(c.id) ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c.name}
            </button>
          ))}
          {project?.characters.length === 0 && <span className="text-xs text-muted-foreground">No characters defined yet.</span>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Dialogue</div>
          <button onClick={addDialogue} className="text-xs text-primary-glow hover:underline">+ Add line</button>
        </div>
        {panel.dialogue.map((d) => (
          <div key={d.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
            <TextInput placeholder="Speaker" value={d.speaker} onChange={(e) => updateDialogue(d.id, { speaker: e.target.value })} />
            <TextInput placeholder="Text" value={d.text} onChange={(e) => updateDialogue(d.id, { text: e.target.value })} />
            <Select value={d.kind} onChange={(e) => updateDialogue(d.id, { kind: e.target.value as DialogueKind })} className="w-auto">
              <option value="speech">speech</option>
              <option value="thought">thought</option>
              <option value="caption">caption</option>
              <option value="shout">shout</option>
            </Select>
            <button onClick={() => removeDialogue(d.id)} className="text-muted-foreground hover:text-destructive"><Icons.X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <Field label="Prompt override" hint="Optional — replaces the compiled prompt entirely.">
        <TextArea rows={2} value={panel.promptOverride} onChange={(e) => onUpdate((p) => ({ ...p, promptOverride: e.target.value }))} placeholder="Leave blank to use compiled prompt" />
      </Field>

      {genError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{genError}</div>}

      <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-muted-foreground hover:text-foreground">
        {showPrompt ? "Hide" : "Show"} compiled prompt
      </button>
      {showPrompt && project && scene && (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {compilePanelPrompt(project, scene, panel).prompt}
        </pre>
      )}
    </Panel>
  );
}
