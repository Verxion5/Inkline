import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { newCharacter, newLocation, uid } from "@/lib/factories";
import { generateCharacter, type CharacterResult } from "@/lib/ai.functions";
import type { Character, Relationship, Outfit } from "@/lib/types";
import { projectContext } from "@/lib/projectContext";

export const Route = createFileRoute("/_app/characters")({
  head: () => ({
    meta: [
      { title: "Character Studio — Inkline" },
      { name: "description", content: "The Character Bible: canonical appearance, outfits, powers and relationships." },
      { property: "og:title", content: "Character Studio — Inkline" },
      { property: "og:description", content: "The Character Bible: canonical appearance, outfits, powers and relationships." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Character Studio" description="The Character Bible: canonical appearance, outfits, powers and relationships." /><ProjectGate /></>;
  return <CharacterStudio projectId={project.id} />;
}

function CharacterStudio({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { upsertCharacter, removeCharacter } = useProjectActions(projectId);
  const [selectedId, setSelectedId] = useState<string | null>(project?.characters[0]?.id ?? null);
  const [aiMode, setAiMode] = useState(false);
  const [aiDesc, setAiDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const runGen = useServerFn(generateCharacter);

  const selected = project?.characters.find((c) => c.id === selectedId) ?? null;

  function addBlank() {
    const c = newCharacter();
    upsertCharacter(c);
    setSelectedId(c.id);
  }

  async function generate() {
    if (!project) return;
    setError("");
    setBusy(true);
    try {
      const res = await runGen({ data: { description: aiDesc.trim(), context: projectContext(project) } });
      const outfitId = uid("out");
      const c = newCharacter({
        id: uid("chr"),
        name: res.name,
        age: res.age,
        role: res.role,
        appearance: res.appearance,
        personality: res.personality,
        expressions: res.expressions,
        poses: res.poses,
        items: res.items,
        powers: res.powers,
        notes: res.notes,
        outfits: res.outfit ? [{ id: outfitId, name: "Default", description: res.outfit, chapterTag: "" }] : [],
        activeOutfitId: res.outfit ? outfitId : null,
        relationships: res.relationships.map((r) => ({ id: uid("rel"), name: r.name, relation: r.relation })),
      });
      upsertCharacter(c);
      setSelectedId(c.id);
      setAiMode(false);
      setAiDesc("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate character.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Character Studio"
        description="The Character Bible: canonical appearance, outfits, powers and relationships."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setAiMode(!aiMode)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/60">
              <Icons.Sparkles className="h-4 w-4" /> AI character
            </button>
            <button onClick={addBlank} className="inline-flex items-center gap-2 rounded-lg violet-gradient px-3 py-2 text-sm text-primary-foreground">
              <Icons.Plus className="h-4 w-4" /> Add character
            </button>
          </div>
        }
      />

      {aiMode && (
        <Panel className="mb-6 space-y-3">
          <Field label="Describe a character" hint="Inkline extracts appearance, personality, outfit, powers and relationships.">
            <TextArea rows={3} autoFocus value={aiDesc} onChange={(e) => setAiDesc(e.target.value)} placeholder="A weathered sword-courier in her thirties, missing two fingers on her left hand, quiet but fiercely loyal…" />
          </Field>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <div className="flex gap-2">
            <button disabled={aiDesc.trim().length < 3 || busy} onClick={() => void generate()} className="rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">
              {busy ? "Generating…" : "Generate character"}
            </button>
            <button onClick={() => setAiMode(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </Panel>
      )}

      {project!.characters.length === 0 ? (
        <EmptyState
          icon={<Icons.Users className="h-5 w-5" />}
          title="No characters yet"
          description="Add a character manually or let AI generate a full character sheet from a description."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {project!.characters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="truncate font-medium">{c.name || "Unnamed"}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {[c.age, c.role].filter(Boolean).join(" · ") || "No role set"}
                </div>
              </button>
            ))}
          </div>

          {selected && <CharacterEditor key={selected.id} character={selected} onSave={upsertCharacter} onDelete={removeCharacter} cast={project!.characters} />}
        </div>
      )}
    </div>
  );
}

function CharacterEditor({ character, onSave, onDelete, cast }: { character: Character; onSave: (c: Character) => void; onDelete: (id: string) => void; cast: Character[] }) {
  const [data, setData] = useState(character);
  const [newRel, setNewRel] = useState({ name: "", relation: "" });
  const [outfitName, setOutfitName] = useState("");
  const [outfitDesc, setOutfitDesc] = useState("");

  function update<K extends keyof Character>(key: K, value: Character[K]) {
    const next = { ...data, [key]: value };
    setData(next);
    onSave(next);
  }

  function addRel() {
    if (!newRel.name.trim()) return;
    const rel: Relationship = { id: uid("rel"), name: newRel.name, relation: newRel.relation };
    update("relationships", [...data.relationships, rel]);
    setNewRel({ name: "", relation: "" });
  }

  function removeRel(id: string) {
    update("relationships", data.relationships.filter((r) => r.id !== id));
  }

  function addOutfit() {
    if (!outfitName.trim()) return;
    const o: Outfit = { id: uid("out"), name: outfitName, description: outfitDesc, chapterTag: "" };
    update("outfits", [...data.outfits, o]);
    setOutfitName("");
    setOutfitDesc("");
  }

  function removeOutfit(id: string) {
    const remaining = data.outfits.filter((o) => o.id !== id);
    update("outfits", remaining);
    if (data.activeOutfitId === id) update("activeOutfitId", remaining[0]?.id ?? null);
  }

  const listField = (key: keyof Character, label: string, placeholder: string) => (
    <Field label={label} hint="Comma separated">
      <TextInput
        defaultValue={(data[key] as string[]).join(", ")}
        onBlur={(e) => update(key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean) as never)}
        placeholder={placeholder}
      />
    </Field>
  );

  return (
    <div className="space-y-6">
      <Panel className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="font-display text-lg">Character sheet</div>
          <button onClick={() => { if (confirm(`Delete "${character.name}"?`)) onDelete(character.id); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/60 hover:text-destructive">
            <Icons.Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name"><TextInput value={data.name} onChange={(e) => update("name", e.target.value)} /></Field>
          <Field label="Age"><TextInput value={data.age} onChange={(e) => update("age", e.target.value)} placeholder="e.g. 32" /></Field>
          <Field label="Role"><TextInput value={data.role} onChange={(e) => update("role", e.target.value)} placeholder="Protagonist, rival…" /></Field>
        </div>
        <Field label="Appearance" hint="Precise, reusable visual description for consistent art generation.">
          <TextArea rows={4} value={data.appearance} onChange={(e) => update("appearance", e.target.value)} placeholder="Face shape, hair, eyes, build, height, skin, distinguishing marks…" />
        </Field>
        <Field label="Personality">
          <TextArea rows={3} value={data.personality} onChange={(e) => update("personality", e.target.value)} placeholder="How they think, speak and act…" />
        </Field>
      </Panel>

      <Panel className="space-y-4">
        <div className="font-display text-lg">Outfits & wardrobe</div>
        {data.outfits.length > 0 && (
          <div className="space-y-2">
            {data.outfits.map((o) => (
              <div key={o.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <button
                  onClick={() => update("activeOutfitId", o.id)}
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${data.activeOutfitId === o.id ? "border-primary bg-primary" : "border-border"}`}
                  title="Set as active"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-muted-foreground">{o.description || "No description"}</div>
                </div>
                <button onClick={() => removeOutfit(o.id)} className="text-muted-foreground hover:text-destructive"><Icons.X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <TextInput placeholder="Outfit name" value={outfitName} onChange={(e) => setOutfitName(e.target.value)} />
          <TextInput placeholder="Description" value={outfitDesc} onChange={(e) => setOutfitDesc(e.target.value)} />
          <button onClick={addOutfit} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/60"><Icons.Plus className="h-4 w-4" /></button>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="font-display text-lg">Powers, items & abilities</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {listField("powers", "Powers / abilities", "fire manipulation, super speed…")}
          {listField("items", "Items / weapons", "Ash Blade, signet ring…")}
          {listField("expressions", "Expressions", "determined, cold fury, vulnerable…")}
          {listField("poses", "Signature poses", "leaning on sword, arms crossed…")}
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="font-display text-lg">Relationships</div>
        {data.relationships.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.relationships.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.relation}</span>
                <button onClick={() => removeRel(r.id)} className="text-muted-foreground hover:text-destructive"><Icons.X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <TextInput placeholder="Character name" value={newRel.name} onChange={(e) => setNewRel({ ...newRel, name: e.target.value })} list="cast-list" />
          <datalist id="cast-list">{cast.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          <TextInput placeholder="Relation (rival, mentor…)" value={newRel.relation} onChange={(e) => setNewRel({ ...newRel, relation: e.target.value })} />
          <button onClick={addRel} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/60"><Icons.Plus className="h-4 w-4" /></button>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="font-display text-lg">Development & continuity</div>
        {listField("changes", "Character changes", "scar on cheek (Ch.3), loses sword (Ch.5)…")}
        <Field label="Notes">
          <TextArea rows={3} value={data.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Backstory, arc notes, anything important…" />
        </Field>
      </Panel>
    </div>
  );
}
