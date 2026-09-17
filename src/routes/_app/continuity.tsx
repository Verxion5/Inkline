import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip, Section } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";
import { checkChapter, projectReadiness, type ContinuityIssue } from "@/lib/continuity";
import type { Chapter } from "@/lib/types";

export const Route = createFileRoute("/_app/continuity")({
  head: () => ({
    meta: [
      { title: "Continuity Center — Inkline" },
      { name: "description", content: "Detected continuity issues with severity and context." },
      { property: "og:title", content: "Continuity Center — Inkline" },
      { property: "og:description", content: "Detected continuity issues with severity and context." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Continuity Center" description="Detected continuity issues with severity and context." /><ProjectGate /></>;
  return <ContinuityPage />;
}

function ContinuityPage() {
  const project = useCurrentProject()!;
  const [filter, setFilter] = useState<"all" | "warning" | "info">("all");

  const readiness = projectReadiness(project);
  const allIssues: { chapter: Chapter | null; issue: ContinuityIssue }[] = [];
  for (const ch of project.chapters) {
    const issues = checkChapter(project, ch);
    for (const issue of issues) allIssues.push({ chapter: ch, issue });
  }

  const filtered = allIssues.filter((x) => filter === "all" || x.issue.level === filter);
  const warnings = allIssues.filter((x) => x.issue.level === "warning").length;
  const infos = allIssues.filter((x) => x.issue.level === "info").length;

  return (
    <div>
      <PageHeader title="Continuity Center" description="Detected continuity issues with severity and context." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Panel className="text-center">
          <div className="font-display text-3xl text-success">{readiness.score}%</div>
          <div className="mt-1 text-xs text-muted-foreground">Project readiness</div>
          {readiness.missing.length > 0 && <div className="mt-2 text-xs text-warning">Missing: {readiness.missing.join(", ")}</div>}
        </Panel>
        <Panel className="text-center">
          <div className="font-display text-3xl text-warning">{warnings}</div>
          <div className="mt-1 text-xs text-muted-foreground">Warnings</div>
        </Panel>
        <Panel className="text-center">
          <div className="font-display text-3xl text-muted-foreground">{infos}</div>
          <div className="mt-1 text-xs text-muted-foreground">Info</div>
        </Panel>
      </div>

      <div className="mb-4 flex gap-2">
        {(["all", "warning", "info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${filter === f ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
          >
            {f === "all" ? "All issues" : f === "warning" ? "Warnings" : "Info"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Icons.ShieldCheck className="h-5 w-5" />} title="No continuity issues detected" description="All panels pass the rule-based checks. This does not guarantee visual consistency — the AI art supervisor provides an additional layer." />
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-4">
              <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.issue.level === "warning" ? "bg-warning" : "bg-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {item.issue.level === "warning" ? <Chip tone="warning">warning</Chip> : <Chip tone="muted">info</Chip>}
                  {item.chapter && <Chip tone="muted">Ch.{item.chapter.number} — {item.chapter.title}</Chip>}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
