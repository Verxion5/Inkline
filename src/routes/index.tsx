import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateStoryboard, type Storyboard } from "@/lib/storyboard.functions";
import { StoryboardPanel } from "@/components/StoryboardPanel";
import { applyPreset, defaultSettings, presetsFor, type ArtSettings, type Format } from "@/lib/artDirection";

export const Route = createFileRoute("/")({
  component: Home,
});


const EXAMPLES = [
  "A courier girl smuggles a caged spirit through a neon-drowned floating city as the sky splits open.",
  "Two rival swordsmiths meet on a snowy bridge; only one will walk away.",
  "A librarian discovers her cat has been writing the missing chapters of a forbidden book.",
];

function Home() {
  const [story, setStory] = useState("");
  const [panelCount, setPanelCount] = useState(4);
  const [board, setBoard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ArtSettings>(() => defaultSettings("manga"));

  const planFn = useServerFn(generateStoryboard);

  async function onGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!story.trim() || loading) return;
    setLoading(true);
    setError(null);
    setBoard(null);
    try {
      const result = await planFn({ data: { story: story.trim(), panelCount } });
      setBoard(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen paper-grain">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center border-2 border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]">
              <span className="font-display text-xl italic leading-none">I</span>
            </div>
            <div>
              <div className="font-display text-xl leading-none">Inkline</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Manga Creative OS · v0.1
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-widest text-muted-foreground md:flex">
            <span>Director</span>
            <span>·</span>
            <span>Writer</span>
            <span>·</span>
            <span>World</span>
            <span>·</span>
            <span>Composer</span>
          </nav>
        </div>
      </header>

      {/* Hero + Prompt */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live storyboard engine
            </p>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Describe a story.
              <br />
              <span className="italic text-primary">Direct the manga.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Inkline is an AI creative OS for manga and manhwa. Type a premise and it plans the panels,
              casts the shots, writes the dialogue, and draws original artwork — no prompt engineering,
              no imitation of real artists.
            </p>

            <div className="mt-10 flex flex-wrap gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <div>
                <div className="font-display text-3xl text-foreground not-italic">01</div>
                Story genome
              </div>
              <div>
                <div className="font-display text-3xl text-foreground not-italic">02</div>
                Scene planner
              </div>
              <div>
                <div className="font-display text-3xl text-foreground not-italic">03</div>
                Prompt compiler
              </div>
              <div>
                <div className="font-display text-3xl text-foreground not-italic">04</div>
                Page composer
              </div>
            </div>
          </div>

          {/* Prompt panel */}
          <form
            onSubmit={onGenerate}
            className="relative rounded-none border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--primary)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Premise
              </label>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {story.length}/2000
              </span>
            </div>

            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value.slice(0, 2000))}
              placeholder="A samurai in a rain-slick alley learns her rival is her sister…"
              rows={6}
              className="w-full resize-none border-b border-border bg-transparent font-display text-2xl leading-snug italic text-foreground outline-none placeholder:text-muted-foreground/60"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setStory(ex)}
                  className="rounded-sm border border-border px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {ex.slice(0, 42)}…
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Panels
                </div>
                <div className="flex gap-1">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPanelCount(n)}
                      className={`h-9 w-9 border-2 font-mono text-sm transition ${
                        panelCount === n
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !story.trim()}
                className="group inline-flex items-center gap-3 border-2 border-foreground bg-primary px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_var(--foreground)] disabled:opacity-50"
              >
                {loading ? "Directing…" : "Direct chapter"}
                <span className="font-display text-lg not-italic">→</span>
              </button>
            </div>

            {error && (
              <p className="mt-4 border-l-2 border-destructive bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                {error}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Storyboard output */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        {!board && !loading && (
          <EmptyState />
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <span className="font-display text-5xl italic text-primary animate-ink">plotting</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              The Director agent is breaking the scene…
            </span>
          </div>
        )}

        {board && (
          <div>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Chapter 01 · Storyboard
                </div>
                <h2 className="mt-1 font-display text-4xl italic md:text-6xl">{board.title}</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">{board.logline}</p>
              </div>
              <button
                onClick={() => onGenerate()}
                className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                ↻ Re-direct
              </button>
            </div>

            <div className={settings.format === "manga" ? "grid gap-10 md:grid-cols-2" : "mx-auto grid max-w-md gap-4"}>
              {board.panels.map((p) => (
                <StoryboardPanel key={p.index} panel={p} board={board} settings={settings} />
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <div>Inkline © 2026 — Original styles only. No artist imitation.</div>
          <div>Director · Writer · World · Prompt Compiler · Composer</div>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[
        { k: "Story Genome", v: "Every premise becomes a persistent world of characters, timelines, and lore." },
        { k: "Cinematic Direction", v: "Panel counts, camera angles, and pacing are chosen automatically." },
        { k: "Original Art", v: "Prompt compiler drafts the shot; the artist agent inks it in your invented style." },
      ].map((c) => (
        <div
          key={c.k}
          className="border-l-2 border-primary bg-card/50 px-5 py-6"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            {c.k}
          </div>
          <p className="mt-3 font-display text-2xl italic leading-snug text-foreground">
            {c.v}
          </p>
        </div>
      ))}
    </div>
  );
}

