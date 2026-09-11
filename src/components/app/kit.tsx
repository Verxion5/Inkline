import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</div>
        )}
        <h1 className="font-display text-3xl leading-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-lg tracking-tight">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={cn("surface-card p-5", interactive && "hover-lift cursor-pointer", className)}>{children}</div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface-card px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-primary">{icon}</div>}
      <div className="font-display text-lg">{title}</div>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/30";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "resize-y leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "appearance-none pr-8", props.className)} />;
}

export function Chip({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary-glow",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function Cover({ seed, className, label }: { seed: string; className?: string; label?: string }) {
  // Deterministic original cover art placeholder (gradient + ink strokes), no fake photography.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const a = `oklch(0.45 0.18 ${h})`;
  const b = `oklch(0.3 0.12 ${(h + 60) % 360})`;
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-border paper-grain", className)}
      style={{ backgroundImage: `linear-gradient(140deg, ${a}, ${b})` }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(${h % 90}deg, oklch(0 0 0 / 0.35) 0 2px, transparent 2px 9px)`,
        }}
      />
      {label && (
        <div className="absolute bottom-2 left-3 font-display text-sm text-foreground drop-shadow">{label}</div>
      )}
    </div>
  );
}
