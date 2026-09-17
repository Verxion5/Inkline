import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Field, TextInput, TextArea, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";

export const Route = createFileRoute("/_app/story")({
  head: () => ({
    meta: [
      { title: "Story Studio — Inkline" },
      { name: "description", content: "Premise, arcs, themes and key events for the active series." },
      { property: "og:title", content: "Story Studio — Inkline" },
      { property: "og:description", content: "Premise, arcs, themes and key events for the active series." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Story Studio" description="Premise, arcs, themes and key events for the active series." /><ProjectGate /></>;
  return <StoryStudio projectId={project.id} />;
}

function StoryStudio({ projectId }: { projectId: string }) {
  const { setFields } = useProjectActions(projectId);
  const [themes, setThemes] = useState("");
  const [orgs, setOrgs] = useState("");
  const [items, setItems] = useState("");
  const [rules, setRules] = useState("");

  return (
    <div>
      <PageHeader title="Story Studio" description="Premise, arcs, themes and key events for the active series." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="space-y-5">
          <div className="font-display text-lg">Core premise</div>
          <Field label="Title">
            <TextInput
              defaultValue={project?.title}
              onBlur={(e) => setFields({ title: e.target.value })}
              placeholder="Series title"
            />
          </Field>
          <Field label="Premise" hint="The original plain-language description — never overwritten.">
            <TextArea
              rows={5}
              defaultValue={project?.premise}
              onBlur={(e) => setFields({ premise: e.target.value })}
              placeholder="Describe your series naturally…"
            />
          </Field>
          <Field label="Logline" hint="One-sentence hook.">
            <TextArea
              rows={2}
              defaultValue={project?.logline}
              onBlur={(e) => setFields({ logline: e.target.value })}
              placeholder="A one-line pitch"
            />
          </Field>
        </Panel>

        <Panel className="space-y-5">
          <div className="font-display text-lg">Genre & tone</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Genre">
              <TextInput
                defaultValue={project?.genre}
                onBlur={(e) => setFields({ genre: e.target.value })}
                placeholder="e.g. dark fantasy, sci-fi thriller"
              />
            </Field>
            <Field label="Tone">
              <TextInput
                defaultValue={project?.tone}
                onBlur={(e) => setFields({ tone: e.target.value })}
                placeholder="e.g. gritty, hopeful, melancholic"
              />
            </Field>
          </div>
          <Field label="Themes" hint="Comma separated">
            <TextInput
              defaultValue={project?.themes.join(", ")}
              onChange={(e) => setThemes(e.target.value)}
              onBlur={(e) => setFields({ themes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="betrayal, redemption, found family"
            />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {project?.themes.map((t) => <Chip key={t} tone="primary">{t}</Chip>)}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <div className="font-display text-lg">World building</div>
          <Field label="Lore" hint="Background history and mythology.">
            <TextArea
              rows={5}
              defaultValue={project?.lore}
              onBlur={(e) => setFields({ lore: e.target.value })}
              placeholder="World history, mythology, key background…"
            />
          </Field>
          <Field label="Organizations" hint="Comma separated">
            <TextInput
              defaultValue={project?.organizations.join(", ")}
              onBlur={(e) => setFields({ organizations: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="The Crimson Order, Merchant Guild…"
            />
          </Field>
          <Field label="Key items" hint="Comma separated">
            <TextInput
              defaultValue={project?.items.join(", ")}
              onBlur={(e) => setFields({ items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="The Ash Blade, Signet Ring…"
            />
          </Field>
        </Panel>

        <Panel className="space-y-5">
          <div className="font-display text-lg">Rules & continuity</div>
          <Field label="World rules" hint="One per line — magic systems, physics, social laws.">
            <TextArea
              rows={4}
              defaultValue={project?.rules.join("\n")}
              onBlur={(e) => setFields({ rules: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              placeholder={"Magic requires a living host\nSteel rusts within a day of the Ashfall"}
            />
          </Field>
          <Field label="Continuity notes" hint="Facts that must hold across all chapters.">
            <TextArea
              rows={4}
              defaultValue={project?.continuityNotes}
              onBlur={(e) => setFields({ continuityNotes: e.target.value })}
              placeholder="It is always winter. The protagonist is left-handed."
            />
          </Field>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Format</div>
            <div className="flex gap-2">
              {(["manga", "webtoon"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFields({ format: f })}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    project?.format === f ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  {f === "manga" ? "Manga · B/W" : "Manhwa · Color"}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
