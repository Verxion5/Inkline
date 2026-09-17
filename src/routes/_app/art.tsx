import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { ArtInspector } from "@/components/ArtInspector";
import { newStyle } from "@/lib/factories";
import { settingsFromStyle } from "@/lib/promptCompiler";
import { compileStylePrompt } from "@/lib/promptCompiler";
import { useServerFn } from "@tanstack/react-start";
import { aiStatus } from "@/lib/ai.functions";
import { describeProvider } from "@/lib/imageProvider.server";
import type { StyleDNA } from "@/lib/types";
import { STYLE_AXES } from "@/lib/factories";

export const Route = createFileRoute("/_app/art")({
  head: () => ({
    meta: [
      { title: "Art Studio — Inkline" },
      { name: "description", content: "Original Style DNA, linework, shading, lighting and provider status." },
      { property: "og:title", content: "Art Studio — Inkline" },
      { property: "og:description", content: "Original Style DNA, linework, shading, lighting and provider status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Art Studio" description="Original Style DNA, linework, shading, lighting and provider status." /><ProjectGate /></>;
  return <ArtStudio projectId={project.id} />;
}

function ArtStudio({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { upsertStyle, removeStyle, setFields } = useProjectActions(projectId);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(project?.activeStyleId ?? project?.styles[0]?.id ?? null);
  const [aiStatusResult, setAiStatusResult] = useState<boolean | null>(null);
  const runStatus = useServerFn(aiStatus);

  const styles = project?.styles ?? [];
  const selected = styles.find((s) => s.id === selectedStyleId) ?? styles[0] ?? null;
  const provider = describeProvider();

  // check AI status on mount
  if (aiStatusResult === null) {
    runStatus().then((r) => setAiStatusResult(r.configured)).catch(() => setAiStatusResult(false));
  }

  function addStyle() {
    const s = newStyle({ name: `Style ${styles.length + 1}` });
    upsertStyle(s);
    setFields({ activeStyleId: s.id });
    setSelectedStyleId(s.id);
  }

  function updateStyle(s: StyleDNA) {
    upsertStyle(s);
  }

  return (
    <div>
      <PageHeader
        title="Art Studio"
        description="Original Style DNA, linework, shading, lighting and provider status."
        actions={
          <button onClick={addStyle} className="inline-flex items-center gap-2 rounded-lg violet-gradient px-3 py-2 text-sm text-primary-foreground">
            <Icons.Plus className="h-4 w-4" /> New style
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="space-y-2">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStyleId(s.id); setFields({ activeStyleId: s.id }); }}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  project?.activeStyleId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${project?.activeStyleId === s.id ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <span className="truncate font-medium">{s.name}</span>
                </div>
                <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{s.lineWeight} · {s.shading} · {s.colorTreatment}</div>
              </button>
            ))}
          </div>

          <Panel className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Generation status</div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${aiStatusResult ? "bg-success" : "bg-destructive"}`} />
              <span className="text-sm">{aiStatusResult ? "AI configured" : "AI not configured"}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Provider: {provider.provider}<br />
              Draft: {provider.models.draft}<br />
              Standard: {provider.models.standard}<br />
              Vision: {provider.visionModel}
            </div>
          </Panel>
        </div>

        {selected && (
          <div className="space-y-6">
            <Panel className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg">Style DNA</div>
                <div className="flex items-center gap-2">
                  {project?.activeStyleId === selected.id && <Chip tone="primary">Active</Chip>}
                  <button onClick={() => { if (confirm(`Delete "${selected.name}"?`)) { removeStyle(selected.id); setSelectedStyleId(null); } }} className="text-muted-foreground hover:text-destructive">
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <label className="block">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Style name</div>
                <input
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                  value={selected.name}
                  onChange={(e) => updateStyle({ ...selected, name: e.target.value })}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                {STYLE_AXES.map((axis) => (
                  <label key={axis.key} className="block">
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{axis.label}</div>
                    <select
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                      value={(selected as Record<string, string>)[axis.key] ?? ""}
                      onChange={(e) => updateStyle({ ...selected, [axis.key]: e.target.value })}
                    >
                      {axis.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                ))}
              </div>

              <label className="block">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Extra notes</div>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                  value={selected.extraNotes}
                  onChange={(e) => updateStyle({ ...selected, extraNotes: e.target.value })}
                  placeholder="Additional style guidance for the prompt compiler…"
                />
              </label>
            </Panel>

            <Panel>
              <div className="mb-3 font-display text-lg">Compiled style prompt</div>
              {project && (
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {compileStylePrompt(project)}
                </pre>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project && settingsFromStyle(project, selected) && Object.entries(settingsFromStyle(project, selected)).map(([k, v]) => (
                  <Chip key={k} tone="muted">{k}: {String(v)}</Chip>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
