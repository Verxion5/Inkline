import { useEffect, useRef, useState } from "react";
import { streamImage } from "@/lib/streamImage";

type PanelData = {
  index: number;
  shot: string;
  description: string;
  dialogue: string;
  sfx: string;
};

type Props = {
  panel: PanelData;
  stylePrompt: string;
  autoStart?: boolean;
};

export function StoryboardPanel({ panel, stylePrompt, autoStart = true }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [status, setStatus] = useState<"idle" | "drawing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function run() {
    setStatus("drawing");
    setError(null);
    setSrc(null);
    setIsFinal(false);
    const prompt = [
      stylePrompt,
      `Shot: ${panel.shot}.`,
      panel.description,
      panel.dialogue ? `Character speaks: "${panel.dialogue}".` : "",
      "No text, no speech bubbles, no watermarks, no signature. Original character designs, no likeness to real people or existing IP.",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      await streamImage("/api/generate-image", prompt, (dataUrl, final) => {
        setSrc(dataUrl);
        if (final) setIsFinal(true);
      });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to draw panel");
      setStatus("error");
    }
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="panel-frame aspect-[4/3] w-full">
        {src ? (
          <img
            src={src}
            alt={panel.description}
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

        {panel.dialogue && src && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10">
            <div className="ml-auto max-w-[80%] rounded-2xl border-2 border-foreground bg-background/95 px-4 py-2 text-sm leading-snug text-foreground shadow-[3px_3px_0_0_var(--primary)]">
              {panel.dialogue}
            </div>
          </div>
        )}
      </div>

      <figcaption className="flex items-start justify-between gap-4 text-xs">
        <p className="text-muted-foreground leading-relaxed">{panel.description}</p>
        {status === "error" && (
          <button
            onClick={run}
            className="shrink-0 rounded-sm border border-primary px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Retry
          </button>
        )}
      </figcaption>
      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </figure>
  );
}
