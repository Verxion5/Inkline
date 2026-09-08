import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { streamImage } from "@/lib/streamImage";
import { compileArtPrompt, type ArtSettings, type CastRef, type PanelBrief } from "@/lib/artDirection";
import type { Storyboard, StoryboardPanelData } from "@/lib/storyboard.functions";
import { reviewPanelArt, type ArtReview } from "@/lib/artReview.functions";

type Props = {
  panel: StoryboardPanelData;
  board: Storyboard;
  settings: ArtSettings;
  autoStart?: boolean;
};

function castRefs(board: Storyboard, panel: StoryboardPanelData): CastRef[] {
  const wanted = panel.characters.map((n) => n.toLowerCase());
  return board.cast
    .filter((c) => wanted.includes(c.name.toLowerCase()))
    .map((c) => ({
      name: c.name,
      identity: [c.age ? `age ${c.age}` : "", c.identity, c.hair ? `hair: ${c.hair}` : "", c.eyes ? `eyes: ${c.eyes}` : "", c.silhouette]
        .filter(Boolean)
        .join(", "),
      outfit: c.outfit,
      props: c.props,
      state: "",
      pose: panel.pose,
      expression: panel.expression,
    }));
}

export function buildBrief(board: Storyboard, panel: StoryboardPanelData): PanelBrief {
  const loc = board.location;
  return {
    shot: panel.shot,
    cameraPosition: panel.cameraPosition,
    lens: panel.lens,
    focalSubject: panel.focalSubject,
    depth: panel.depth,
    bubbleSpace: panel.bubbleSpace,
    actionDirection: panel.actionDirection,
    action: panel.action,
    emotion: panel.emotion,
    cast: castRefs(board, panel),
    environment: [loc.name, loc.description, loc.architecture, loc.lighting, loc.weather, loc.keyObjects.join(", ")]
      .filter(Boolean)
      .join(" — "),
    tone: board.tone,
    continuity: board.continuity,
  };
}

export function StoryboardPanel({ panel, board, settings, autoStart = true }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [status, setStatus] = useState<"idle" | "drawing" | "reviewing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ArtReview | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const startedRef = useRef(false);
  const reviewFn = useServerFn(reviewPanelArt);

  const draw = useCallback(
    async (refinement = "") => {
      setStatus("drawing");
      setError(null);
      setReview(null);
      setIsFinal(false);
      const compiled = compileArtPrompt(buildBrief(board, panel), settings);
      const prompt = refinement ? `${compiled.prompt}\nCorrection: ${refinement}` : compiled.prompt;
      let last: string | null = null;
      try {
        await streamImage(
          "/api/generate-image",
          {
            prompt,
            negative: compiled.negative,
            aspect: compiled.aspect,
            format: compiled.format,
            quality: compiled.quality,
          },
          (dataUrl, final) => {
            last = dataUrl;
            setSrc(dataUrl);
            if (final) setIsFinal(true);
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to draw panel");
        setStatus("error");
        return;
      }

      if (settings.review && last && !refinement) {
        setStatus("reviewing");
        try {
          const verdict = await reviewFn({ data: { image: last, brief: compiled.prompt, format: compiled.format } });
          setReview(verdict);
          if (verdict.verdict === "refine" && verdict.refinement) {
            await draw(verdict.refinement);
            return;
          }
        } catch {
          /* review is best-effort; the drawn panel still stands */
        }
      }
      setStatus("done");
    },
    [board, panel, settings, reviewFn],
  );

  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void draw();
  }, [autoStart, draw]);

  const compiled = compileArtPrompt(buildBrief(board, panel), settings);
  const aspectClass = settings.format === "manga" ? "aspect-[4/3]" : "aspect-[3/4]";

  return (
    <figure className="flex flex-col gap-3">
      <div className={`panel-frame w-full ${aspectClass}`}>
        {src ? (
          <img
            src={src}
            alt={panel.action}
            className={`h-full w-full object-cover transition-[filter,transform] duration-500 ${
              isFinal ? "blur-0 scale-100" : "blur-lg scale-105"
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 paper-grain">
            <span className="font-display text-4xl italic text-primary animate-ink">
              {status === "error" ? "×" : "inking"}
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Panel {String(panel.index).padStart(2, "0")}
            </span>
          </div>
        )}

        {panel.sfx && src && (
          <span
            className="sfx-text pointer-events-none absolute right-4 top-4 text-4xl md:text-5xl text-accent"
            aria-hidden
          >
            {panel.sfx}
          </span>
        )}

        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-sm border border-foreground/70 bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-foreground">
          {String(panel.index).padStart(2, "0")} · {panel.shot}
        </span>

        {status === "reviewing" && (
          <span className="absolute bottom-3 left-3 z-10 rounded-sm bg-foreground/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-background">
            Art supervisor reviewing…
          </span>
        )}

        {panel.dialogue && src && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10">
            <div className="ml-auto max-w-[80%] rounded-2xl border-2 border-foreground bg-background/95 px-4 py-2 text-sm leading-snug text-foreground shadow-[3px_3px_0_0_var(--primary)]">
              {panel.dialogue}
            </div>
          </div>
        )}
      </div>

      <figcaption className="flex items-start justify-between gap-4 text-xs">
        <p className="text-muted-foreground leading-relaxed">{panel.action}</p>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => setShowPrompt((v) => !v)}
            className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            Prompt
          </button>
          <button
            onClick={() => void draw()}
            disabled={status === "drawing" || status === "reviewing"}
            className="rounded-sm border border-primary px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            Redraw
          </button>
        </div>
      </figcaption>

      {review && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Review {review.score}/10 · {review.verdict}
          {review.issues.length ? ` · ${review.issues.slice(0, 2).join("; ")}` : ""}
        </p>
      )}

      {showPrompt && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap border border-border bg-card p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {compiled.prompt}
          {"\n\nAvoid: "}
          {compiled.negative.join("; ")}
        </pre>
      )}

      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </figure>
  );
}
