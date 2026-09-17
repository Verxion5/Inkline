import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip, Select } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { compilePanelPrompt } from "@/lib/promptCompiler";
import { streamImage } from "@/lib/streamImage";
import type { Chapter, Scene, Panel as PanelType, DialogueBlock, DialogueKind } from "@/lib/types";
import { uid } from "@/lib/factories";

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
  return <Editor projectId={project.id} />;
}

function Editor({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { updatePanel, updateScene } = useProjectActions(projectId);
  const [chId, setChId] = useState<string | null>(project?.chapters[0]?.id ?? null);
  const [scId, setScId] = useState<string | null>(null);
  const [selPanel, setSelPanel] = useState<string | null>(null);

  const chapters = project?.chapters ?? [];
  const chapter = chapters.find((c) => c.id === chId) ?? null;
  const scenes = chapter?.scenes ?? [];
  const scene = scenes.find((s) => s.id === scId) ?? scenes[0] ?? null;
  const panels = scene?.panels ?? [];
  const selected = panels.find((p) => p.id === selPanel) ?? null;
  const isManga = project?.format === "manga";

  if (chapters.length === 0) {
    return (
      <div>
        <PageHeader title="Comic Editor" description="Page and vertical canvas editor with editable dialogue, narration and SFX overlays." />
        <EmptyState icon={<Icons.PanelsTopLeft className="h-5 w-5" />} title="No chapters to edit" description="Create a chapter in the Chapter Studio first, then compose pages here." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Comic Editor" description="Page and vertical canvas editor with editable dialogue, narration and SFX overlays." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={chId ?? ""} onChange={(e) => { setChId(e.target.value); setScId(null); setSelPanel(null); }}>
          {chapters.map((c) => <option key={c.id} value={c.id}>Ch.{c.number} — {c.title}</option>)}
        </Select>
        {scenes.length > 0 && (
          <Select value={scene?.id ?? ""} onChange={(e) => { setScId(e.target.value); setSelPanel(null); }}>
            {scenes.map((s, i) => <option key={s.id} value={s.id}>Scene {i + 1} — {s.title}</option>)}
          </Select>
        )}
      </div>

      {scene && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Canvas */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg">{isManga ? "Page layout" : "Vertical scroll"}</h3>
              <Chip tone="muted">{panels.length} panels</Chip>
            </div>
            {panels.length === 0 ? (
              <EmptyState icon={<Icons.PanelsTopLeft className="h-5 w-5" />} title="No panels in this scene" description="Generate a chapter with AI or add panels in the Scene Director." />
            ) : isManga ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {panels.map((p, i) => (
                  <PanelThumb key={p.id} panel={p} index={i} isManga selected={selPanel === p.id} onClick={() => setSelPanel(p.id)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {panels.map((p, i) => (
                  <PanelThumb key={p.id} panel={p} index={i} isManga={false} selected={selPanel === p.id} onClick={() => setSelPanel(p.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Inspector */}
          <div>
            {selected && scene && chapter ? (
              <PanelInspector
                panel={selected}
                chapterId={chapter.id}
                sceneId={scene.id}
                projectId={projectId}
                onUpdate={(fn) => updatePanel(chapter.id, scene.id, selected.id, fn)}
              />
            ) : (
              <Panel className="text-center text-sm text-muted-foreground">
                <Icons.MousePointer2 className="mx-auto mb-2 h-6 w-6 opacity-40" />
                Select a panel to edit its dialogue, art and metadata.
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelThumb({ panel, index, isManga, selected, onClick }: { panel: PanelType; index: number; isManga: boolean; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border-2 transition ${selected ? "border-primary" : "border-border hover:border-primary/40"}`}
      style={{ aspectRatio: isManga ? "4/3" : "3/4" }}
    >
      {panel.imageUrl ? (
        <img src={panel.imageUrl} alt={panel.description} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted paper-grain">
          {panel.status === "drawing" ? (
            <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <Icons.ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
      )}
      <span className="absolute left-2 top-2 rounded-sm border border-foreground/60 bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
        {String(index + 1).padStart(2, "0")} · {panel.shot}
      </span>
      {panel.status === "drawn" && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-success" />}
      {panel.sfx && panel.imageUrl && (
        <span className="sfx-text pointer-events-none absolute right-3 top-3 text-2xl text-accent">{panel.sfx}</span>
      )}
      {panel.dialogue.length > 0 && panel.imageUrl && (
        <div className="absolute inset-x-2 bottom-2 space-y-1">
          {panel.dialogue.slice(0, 2).map((d) => (
            <div key={d.id} className={`rounded-lg border border-foreground/70 bg-background/90 px-2 py-1 text-[11px] ${d.kind === "thought" ? "italic" : ""}`}>
              {d.speaker && <span className="font-semibold">{d.speaker}: </span>}{d.text}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

function PanelInspector({ panel, chapterId, sceneId, projectId, onUpdate }: {
  panel: PanelType; chapterId: string; sceneId: string; projectId: string;
  onUpdate: (fn: (p: Panel) => Panel) => void;
}) {
  const project = useCurrentProject();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const chapter = project?.chapters.find((c) => c.id === chapterId);
  const scene = chapter?.scenes.find((s) => s.id === sceneId);

  async function generate() {
    if (!project || !scene) return;
    setGenerating(true);
    setGenError("");
    onUpdate((p) => ({ ...p, status: "drawing" }));
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
      if (lastUrl) onUpdate((p) => ({ ...p, imageUrl: lastUrl, status: "drawn" }));
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
      onUpdate((p) => ({ ...p, status: "error" }));
    } finally {
      setGenerating(false);
    }
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

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg">Panel inspector</div>
        <button onClick={generate} disabled={generating} className="inline-flex items-center gap-1.5 rounded-lg violet-gradient px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-40">
          {generating ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.Palette className="h-3.5 w-3.5" />}
          {generating ? "Drawing…" : panel.imageUrl ? "Regenerate" : "Generate"}
        </button>
      </div>

      {genError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{genError}</div>}

      {panel.imageUrl && (
        <div className="overflow-hidden rounded-lg border border-border">
          <img src={panel.imageUrl} alt={panel.description} className="w-full" />
        </div>
      )}

      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Shot</div>
        <div className="text-sm">{panel.shot}</div>
      </div>

      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Action</div>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          value={panel.description}
          onChange={(e) => onUpdate((p) => ({ ...p, description: e.target.value }))}
        />
      </div>

      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Emotion</div>
        <input
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          value={panel.emotion}
          onChange={(e) => onUpdate((p) => ({ ...p, emotion: e.target.value }))}
        />
      </div>

      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">SFX</div>
        <input
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          value={panel.sfx}
          onChange={(e) => onUpdate((p) => ({ ...p, sfx: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Dialogue</div>
          <button onClick={addDialogue} className="text-xs text-primary-glow hover:underline">+ Add</button>
        </div>
        {panel.dialogue.map((d) => (
          <div key={d.id} className="space-y-1.5 rounded-lg border border-border p-2">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-border bg-input px-2 py-1 text-xs outline-none focus:border-primary"
                placeholder="Speaker"
                value={d.speaker}
                onChange={(e) => updateDialogue(d.id, { speaker: e.target.value })}
              />
              <select
                className="rounded border border-border bg-input px-2 py-1 text-xs outline-none focus:border-primary"
                value={d.kind}
                onChange={(e) => updateDialogue(d.id, { kind: e.target.value as DialogueKind })}
              >
                <option value="speech">speech</option>
                <option value="thought">thought</option>
                <option value="caption">caption</option>
                <option value="shout">shout</option>
              </select>
              <button onClick={() => removeDialogue(d.id)} className="text-muted-foreground hover:text-destructive"><Icons.X className="h-3.5 w-3.5" /></button>
            </div>
            <input
              className="w-full rounded border border-border bg-input px-2 py-1 text-xs outline-none focus:border-primary"
              placeholder="Text"
              value={d.text}
              onChange={(e) => updateDialogue(d.id, { text: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cast</div>
        <div className="flex flex-wrap gap-1.5">
          {panel.characterIds.map((id) => {
            const c = project?.characters.find((x) => x.id === id);
            return c ? <Chip key={id} tone="primary">{c.name}</Chip> : null;
          })}
          {panel.characterIds.length === 0 && <span className="text-xs text-muted-foreground">No cast</span>}
        </div>
      </div>
    </Panel>
  );
}
