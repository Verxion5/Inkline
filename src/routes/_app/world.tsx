import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { newLocation, uid } from "@/lib/factories";
import { generateLocation, type LocationResult } from "@/lib/ai.functions";
import type { Location } from "@/lib/types";
import { projectContext } from "@/lib/projectContext";

export const Route = createFileRoute("/_app/world")({
  head: () => ({
    meta: [
      { title: "World Studio — Inkline" },
      { name: "description", content: "The World Bible: locations, factions, history, technology and world rules." },
      { property: "og:title", content: "World Studio — Inkline" },
      { property: "og:description", content: "The World Bible: locations, factions, history, technology and world rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="World Studio" description="The World Bible: locations, factions, history, technology and world rules." /><ProjectGate /></>;
  return <WorldStudio projectId={project.id} />;
}

function WorldStudio({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { upsertLocation, removeLocation } = useProjectActions(projectId);
  const [selectedId, setSelectedId] = useState<string | null>(project?.locations[0]?.id ?? null);
  const [aiMode, setAiMode] = useState(false);
  const [aiDesc, setAiDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const runGen = useServerFn(generateLocation);

  const selected = project?.locations.find((l) => l.id === selectedId) ?? null;

  function addBlank() {
    const loc = newLocation();
    upsertLocation(loc);
    setSelectedId(loc.id);
  }

  async function generate() {
    if (!project) return;
    setError("");
    setBusy(true);
    try {
      const res = await runGen({ data: { description: aiDesc.trim(), context: projectContext(project) } });
      const loc = newLocation({
        id: uid("loc"),
        name: res.name,
        description: res.description,
        architecture: res.architecture,
        atmosphere: res.atmosphere,
        geography: res.geography,
        lighting: res.lighting,
        weather: res.weather,
        objects: res.objects,
        notes: res.notes,
      });
      upsertLocation(loc);
      setSelectedId(loc.id);
      setAiMode(false);
      setAiDesc("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate location.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="World Studio"
        description="The World Bible: locations, factions, history, technology and world rules."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setAiMode(!aiMode)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/60">
              <Icons.Sparkles className="h-4 w-4" /> AI location
            </button>
            <button onClick={addBlank} className="inline-flex items-center gap-2 rounded-lg violet-gradient px-3 py-2 text-sm text-primary-foreground">
              <Icons.Plus className="h-4 w-4" /> Add location
            </button>
          </div>
        }
      />

      {aiMode && (
        <Panel className="mb-6 space-y-3">
          <Field label="Describe a location" hint="Inkline extracts architecture, atmosphere, lighting and key objects.">
            <TextArea rows={3} autoFocus value={aiDesc} onChange={(e) => setAiDesc(e.target.value)} placeholder="A floating market city suspended above an endless cloud sea…" />
          </Field>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <div className="flex gap-2">
            <button disabled={aiDesc.trim().length < 3 || busy} onClick={() => void generate()} className="rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">
              {busy ? "Generating…" : "Generate location"}
            </button>
            <button onClick={() => setAiMode(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </Panel>
      )}

      {project!.locations.length === 0 ? (
        <EmptyState
          icon={<Icons.Globe2 className="h-5 w-5" />}
          title="No locations yet"
          description="Add a location manually or let AI generate one from a description."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {project!.locations.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === l.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="truncate font-medium">{l.name || "Unnamed"}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{l.atmosphere || l.description || "No description"}</div>
              </button>
            ))}
          </div>

          {selected && <LocationEditor key={selected.id} loc={selected} onSave={upsertLocation} onDelete={removeLocation} />}
        </div>
      )}
    </div>
  );
}

function LocationEditor({ loc, onSave, onDelete }: { loc: Location; onSave: (l: Location) => void; onDelete: (id: string) => void }) {
  const [data, setData] = useState(loc);

  function update<K extends keyof Location>(key: K, value: Location[K]) {
    const next = { ...data, [key]: value };
    setData(next);
    onSave(next);
  }

  return (
    <Panel className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg">Location details</div>
        <button
          onClick={() => { if (confirm(`Delete "${loc.name}"?`)) onDelete(loc.id); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/60 hover:text-destructive"
        >
          <Icons.Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
      <Field label="Name">
        <TextInput value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Location name" />
      </Field>
      <Field label="Description">
        <TextArea rows={3} value={data.description} onChange={(e) => update("description", e.target.value)} placeholder="What is this place?" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Architecture">
          <TextInput value={data.architecture} onChange={(e) => update("architecture", e.target.value)} placeholder="Building style, materials" />
        </Field>
        <Field label="Atmosphere">
          <TextInput value={data.atmosphere} onChange={(e) => update("atmosphere", e.target.value)} placeholder="Mood, feeling" />
        </Field>
        <Field label="Geography">
          <TextInput value={data.geography} onChange={(e) => update("geography", e.target.value)} placeholder="Terrain, surroundings" />
        </Field>
        <Field label="Lighting">
          <TextInput value={data.lighting} onChange={(e) => update("lighting", e.target.value)} placeholder="Natural, harsh, dim" />
        </Field>
        <Field label="Weather">
          <TextInput value={data.weather} onChange={(e) => update("weather", e.target.value)} placeholder="Climate, conditions" />
        </Field>
        <Field label="Key objects" hint="Comma separated">
          <TextInput
            value={data.objects.join(", ")}
            onBlur={(e) => update("objects", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="market stalls, shrine, well"
          />
        </Field>
      </div>
      {data.objects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.objects.map((o, i) => <Chip key={i} tone="muted">{o}</Chip>)}
        </div>
      )}
      <Field label="Notes">
        <TextArea rows={2} value={data.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Additional details" />
      </Field>
    </Panel>
  );
}
