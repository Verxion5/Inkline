import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { newEvent } from "@/lib/factories";
import type { TimelineEvent } from "@/lib/types";

export const Route = createFileRoute("/_app/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Inkline" },
      { name: "description", content: "Chronological events, ages, outfits, injuries and power progression." },
      { property: "og:title", content: "Timeline — Inkline" },
      { property: "og:description", content: "Chronological events, ages, outfits, injuries and power progression." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Timeline" description="Chronological events, ages, outfits, injuries and power progression." /><ProjectGate /></>;
  return <TimelinePage projectId={project.id} />;
}

function TimelinePage({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { patch } = useProjectActions(projectId);
  const [editing, setEditing] = useState<string | null>(null);

  function addEvent() {
    const evt = newEvent({ title: "New event" });
    patch((p) => ({ ...p, timeline: [...p.timeline, evt] }));
    setEditing(evt.id);
  }

  function updateEvent(id: string, fn: (e: TimelineEvent) => TimelineEvent) {
    patch((p) => ({ ...p, timeline: p.timeline.map((e) => (e.id === id ? fn(e) : e)) }));
  }

  function removeEvent(id: string) {
    patch((p) => ({ ...p, timeline: p.timeline.filter((e) => e.id !== id) }));
  }

  const events = project?.timeline ?? [];

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="Chronological events, ages, outfits, injuries and power progression."
        actions={
          <button onClick={addEvent} className="inline-flex items-center gap-2 rounded-lg violet-gradient px-3 py-2 text-sm text-primary-foreground">
            <Icons.Plus className="h-4 w-4" /> Add event
          </button>
        }
      />

      {events.length === 0 ? (
        <EmptyState icon={<Icons.History className="h-5 w-5" />} title="No timeline events" description="Track important story events, character changes and world shifts chronologically." />
      ) : (
        <div className="relative space-y-3 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {events.map((e) => (
            <div key={e.id} className="relative">
              <span className="absolute -left-4 top-3 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              {editing === e.id ? (
                <Panel className="space-y-3">
                  <Field label="Title"><TextInput value={e.title} onChange={(ev) => updateEvent(e.id, (x) => ({ ...x, title: ev.target.value }))} /></Field>
                  <Field label="Description"><TextArea rows={3} value={e.description} onChange={(ev) => updateEvent(e.id, (x) => ({ ...x, description: ev.target.value }))} /></Field>
                  <Field label="Linked chapter">
                    <select
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                      value={e.chapterId ?? ""}
                      onChange={(ev) => updateEvent(e.id, (x) => ({ ...x, chapterId: ev.target.value || null }))}
                    >
                      <option value="">— none —</option>
                      {project?.chapters.map((c) => <option key={c.id} value={c.id}>Ch.{c.number} — {c.title}</option>)}
                    </select>
                  </Field>
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Involved characters</div>
                    <div className="flex flex-wrap gap-2">
                      {project?.characters.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => updateEvent(e.id, (x) => ({
                            ...x,
                            characterIds: x.characterIds.includes(c.id) ? x.characterIds.filter((id) => id !== c.id) : [...x.characterIds, c.id],
                          }))}
                          className={`rounded-full border px-2.5 py-0.5 text-xs ${e.characterIds.includes(c.id) ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Done</button>
                    <button onClick={() => removeEvent(e.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:border-destructive/60">Delete</button>
                  </div>
                </Panel>
              ) : (
                <button onClick={() => setEditing(e.id)} className="w-full rounded-lg border border-border p-3 text-left hover:border-primary/40">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{e.title || "Untitled event"}</span>
                    {e.chapterId && <Chip tone="muted">{project?.chapters.find((c) => c.id === e.chapterId)?.title ?? ""}</Chip>}
                  </div>
                  {e.description && <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>}
                  {e.characterIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.characterIds.map((id) => {
                        const c = project?.characters.find((x) => x.id === id);
                        return c ? <Chip key={id} tone="muted">{c.name}</Chip> : null;
                      })}
                    </div>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
