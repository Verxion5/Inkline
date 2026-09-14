import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, Chip } from "@/components/app/kit";
import { generateBrain, type BrainResult } from "@/lib/ai.functions";
import { createProject } from "@/lib/store";
import { newCharacter, newLocation, newStyle, uid } from "@/lib/factories";
import type { ProjectFormat } from "@/lib/types";
import { sanitizeStyleRequest } from "@/lib/promptCompiler";

export const Route = createFileRoute("/_app/projects/new")({
  head: () => ({
    meta: [
      { title: "New Project — Inkline" },
      { name: "description", content: "Describe your series in plain language and Inkline drafts the premise, cast, world and original visual direction." },
      { property: "og:title", content: "New Project — Inkline" },
      { property: "og:description", content: "Describe your series and Inkline drafts the story brain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewProject,
});

type Step = "brief" | "review";

function NewProject() {
  const navigate = useNavigate();
  const run = useServerFn(generateBrain);

  const [step, setStep] = useState<Step>("brief");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<ProjectFormat>("manga");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<BrainResult | null>(null);

  const styleWarning = sanitizeStyleRequest(description);

  async function build() {
    setError("");
    setBusy(true);
    try {
      const res = await run({ data: { premise: description.trim(), format } });
      setDraft(res);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft the project.");
    } finally {
      setBusy(false);
    }
  }

  function blankProject() {
    const p = createProject({ title: "Untitled project", premise: description.trim(), format });
    void navigate({ to: "/story" });
    return p;
  }

  function approve() {
    if (!draft) return;
    const style = newStyle({ ...draft.style });
    const characters = draft.characters.map((c) => {
      const outfitId = uid("out");
      return newCharacter({
        name: c.name,
        age: c.age,
        role: c.role,
        appearance: c.appearance,
        personality: c.personality,
        items: c.items,
        powers: c.powers,
        relationships: c.relationships.map((r) => ({ id: uid("rel"), name: r.name, relation: r.relation })),
        outfits: c.outfit ? [{ id: outfitId, name: "Default", description: c.outfit, chapterTag: "" }] : [],
        activeOutfitId: c.outfit ? outfitId : null,
      });
    });
    const locations = draft.locations.map((l) => newLocation({ ...l }));

    createProject({
      title: draft.title,
      premise: description.trim(),
      logline: draft.logline,
      genre: draft.genre,
      tone: draft.tone,
      themes: draft.themes,
      lore: draft.lore,
      organizations: draft.organizations,
      items: draft.items,
      rules: draft.rules,
      format,
      characters,
      locations,
      styles: [style],
      activeStyleId: style.id,
    });
    void navigate({ to: "/story" });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Home · New project"
        title="Describe your series"
        description="Write it the way you'd tell a friend. Inkline extracts the premise, genre, tone, themes, cast, world and an original visual direction — all of it editable afterwards."
      />

      <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        <span className={step === "brief" ? "text-primary-glow" : ""}>1 · Brief</span>
        <Icons.ChevronRight className="h-3 w-3" />
        <span className={step === "review" ? "text-primary-glow" : ""}>2 · Review & approve</span>
      </div>

      {step === "brief" && (
        <Panel className="space-y-5">
          <Field label="Your description" hint="Kept verbatim as the project's original brief — nothing is overwritten.">
            <TextArea
              rows={9}
              autoFocus
              placeholder="A disgraced sword-courier walks the ash roads of a broken empire, delivering blades to people who shouldn't have them…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Format</div>
            <div className="flex gap-2">
              {(["manga", "webtoon"] as ProjectFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    format === f ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {f === "manga" ? "Manga · page-based, inked B&W" : "Manhwa · vertical scroll, colour"}
                </button>
              ))}
            </div>
          </div>

          {!styleWarning.safe && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              {styleWarning.note}
            </div>
          )}

          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}

          <div className="flex flex-wrap gap-3">
            <button
              disabled={description.trim().length < 12 || busy}
              onClick={() => void build()}
              className="inline-flex items-center gap-2 rounded-lg violet-gradient px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-40"
            >
              {busy ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Sparkles className="h-4 w-4" />}
              {busy ? "Drafting the story brain…" : "Draft with AI"}
            </button>
            <button
              disabled={busy}
              onClick={() => blankProject()}
              className="rounded-lg border border-border px-4 py-2.5 text-sm hover:border-primary/60 disabled:opacity-40"
            >
              Start blank instead
            </button>
          </div>
          {description.trim().length < 12 && (
            <p className="text-xs text-muted-foreground">Write at least a sentence to enable AI drafting.</p>
          )}
        </Panel>
      )}

      {step === "review" && draft && (
        <div className="space-y-5">
          <Panel className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
              <Field label="Genre">
                <TextInput value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} />
              </Field>
            </div>
            <Field label="Logline">
              <TextArea rows={2} value={draft.logline} onChange={(e) => setDraft({ ...draft, logline: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tone">
                <TextInput value={draft.tone} onChange={(e) => setDraft({ ...draft, tone: e.target.value })} />
              </Field>
              <Field label="Themes" hint="Comma separated">
                <TextInput
                  value={draft.themes.join(", ")}
                  onChange={(e) => setDraft({ ...draft, themes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </Field>
            </div>
            <Field label="Lore">
              <TextArea rows={3} value={draft.lore} onChange={(e) => setDraft({ ...draft, lore: e.target.value })} />
            </Field>
          </Panel>

          <Panel>
            <div className="mb-3 font-display text-lg">Cast ({draft.characters.length})</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {draft.characters.map((c, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{[c.age, c.role].filter(Boolean).join(" · ")}</div>
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{c.appearance}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 font-display text-lg">World ({draft.locations.length})</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {draft.locations.map((l, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="font-medium">{l.name}</div>
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{l.description}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 font-display text-lg">Visual direction</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(draft.style).map(([k, v]) => (
                <Chip key={k} tone="muted">
                  {k}: {String(v)}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Original attribute-based style DNA — no artist or franchise imitation. Tune it later in the Art Studio.
            </p>
          </Panel>

          <div className="flex flex-wrap gap-3">
            <button onClick={approve} className="rounded-lg violet-gradient px-4 py-2.5 text-sm text-primary-foreground">
              Approve & create project
            </button>
            <button onClick={() => setStep("brief")} className="rounded-lg border border-border px-4 py-2.5 text-sm hover:border-primary/60">
              Back to brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
