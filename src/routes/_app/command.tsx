import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject, useProjectActions } from "@/lib/store";
import { runCommand, type CommandResult } from "@/lib/ai.functions";
import { projectContext } from "@/lib/projectContext";
import type { Character, Location, StyleDNA, Panel as PanelType, Project } from "@/lib/types";
import { uid, newPanel } from "@/lib/factories";

export const Route = createFileRoute("/_app/command")({
  head: () => ({
    meta: [
      { title: "AI Command Center — Inkline" },
      { name: "description", content: "Natural-language commands that update your project state." },
      { property: "og:title", content: "AI Command Center — Inkline" },
      { property: "og:description", content: "Natural-language commands that update your project state." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="AI Command Center" description="Natural-language commands that update your project state." /><ProjectGate /></>;
  return <CommandCenter projectId={project.id} />;
}

type ChatMsg = { role: "user" | "ai"; text: string; result?: CommandResult };

function CommandCenter({ projectId }: { projectId: string }) {
  const project = useCurrentProject();
  const { patch } = useProjectActions(projectId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runCmd = useServerFn(runCommand);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!project || !input.trim()) return;
    const cmd = input.trim();
    setInput("");
    setError("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: cmd }]);

    try {
      const result = await runCmd({ data: { command: cmd, context: projectContext(project, { withIds: true }) } });
      applyOperations(result);
      setMessages((m) => [...m, { role: "ai", text: result.explanation, result }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Command failed.");
      setMessages((m) => [...m, { role: "ai", text: "I couldn't process that. " + (e instanceof Error ? e.message : "") }]);
    } finally {
      setBusy(false);
    }
  }

  function applyOperations(result: CommandResult) {
    if (!result.understood || !result.operations.length) return;
    patch((p) => {
      let next = { ...p };
      for (const op of result.operations) {
        switch (op.type) {
          case "updateProject":
            next = { ...next, ...op.fields } as Project;
            break;
          case "updateCharacter": {
            const fields = op.fields;
            next = { ...next, characters: next.characters.map((c) => {
              if (c.id !== op.targetId) return c;
              const updated: Character = { ...c };
              for (const [k, v] of Object.entries(fields)) {
                if (k in updated) (updated as never as Record<string, unknown>)[k] = v;
              }
              return updated;
            }) };
            break;
          }
          case "updateLocation": {
            const fields = op.fields;
            next = { ...next, locations: next.locations.map((l) => {
              if (l.id !== op.targetId) return l;
              const updated: Location = { ...l };
              for (const [k, v] of Object.entries(fields)) {
                if (k in updated) (updated as never as Record<string, unknown>)[k] = v;
              }
              return updated;
            }) };
            break;
          }
          case "updateStyle": {
            const fields = op.fields;
            next = { ...next, styles: next.styles.map((s) => {
              if (s.id !== op.targetId) return s;
              const updated: StyleDNA = { ...s };
              for (const [k, v] of Object.entries(fields)) {
                if (k in updated) (updated as never as Record<string, unknown>)[k] = v;
              }
              return updated;
            }) };
            break;
          }
          case "addPanel": {
            const fields = op.fields;
            next = {
              ...next,
              chapters: next.chapters.map((c) => {
                const scene = c.scenes.find((s) => s.id === op.targetId);
                if (!scene) return c;
                const panel = newPanel({
                  shot: String(fields.shot ?? "medium shot"),
                  description: String(fields.description ?? ""),
                  emotion: String(fields.emotion ?? ""),
                  sfx: String(fields.sfx ?? ""),
                });
                return { ...c, scenes: c.scenes.map((s) => s.id === scene.id ? { ...s, panels: [...s.panels, panel] } : s) };
              }),
            };
            break;
          }
          case "addTimelineEvent": {
            const fields = op.fields;
            next = {
              ...next,
              timeline: [...next.timeline, { id: uid("evt"), title: String(fields.title ?? "New event"), description: String(fields.description ?? ""), chapterId: null, characterIds: [] }],
            };
            break;
          }
        }
      }
      return next;
    });
  }

  const suggestions = [
    "Add a mysterious mentor character",
    "Change the tone to more hopeful",
    "Make the protagonist's sword glowing",
    "Add a scene where the rivals meet",
  ];

  return (
    <div>
      <PageHeader title="AI Command Center" description="Natural-language commands that update your project state." />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <div ref={scrollRef} className="surface-card min-h-[400px] max-h-[500px] space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <Icons.Sparkles className="h-10 w-10 text-primary-glow" />
                <div>
                  <div className="font-display text-lg">Talk to your co-director</div>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Tell Inkline what to change in your project. It understands characters, locations, story, style and panels.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setInput(s)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "violet-gradient text-primary-foreground" : "border border-border bg-card"}`}>
                    <div>{m.text}</div>
                    {m.result?.operations && m.result.operations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.result.operations.map((op, j) => (
                          <span key={j} className="rounded-full bg-background/50 px-2 py-0.5 text-[10px] font-mono">{op.type}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-border bg-input px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Tell Inkline what to change…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !busy) void send(); }}
              disabled={busy}
            />
            <button onClick={() => void send()} disabled={busy || !input.trim()} className="inline-flex items-center gap-2 rounded-lg violet-gradient px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-40">
              {busy ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Panel className="space-y-3 h-fit">
          <div className="font-display text-lg">Project context</div>
          <p className="text-xs text-muted-foreground">The AI sees your full project state — characters, locations, chapters, style and timeline — with IDs so it can target the right entities.</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Characters</span><Chip tone="muted">{project?.characters.length ?? 0}</Chip></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Locations</span><Chip tone="muted">{project?.locations.length ?? 0}</Chip></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Chapters</span><Chip tone="muted">{project?.chapters.length ?? 0}</Chip></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Timeline</span><Chip tone="muted">{project?.timeline.length ?? 0}</Chip></div>
          </div>
          <Link to="/continuity" className="block rounded-lg border border-border p-3 text-xs hover:border-primary/40">
            <Icons.ShieldAlert className="mb-1 h-4 w-4 text-warning" />
            Check continuity for issues
          </Link>
        </Panel>
      </div>
    </div>
  );
}
