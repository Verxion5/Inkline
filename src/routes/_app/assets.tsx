import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { PageHeader, Panel, EmptyState, Chip } from "@/components/app/kit";
import { ProjectGate } from "@/components/app/ProjectGate";
import { useCurrentProject } from "@/lib/store";

export const Route = createFileRoute("/_app/assets")({
  head: () => ({
    meta: [
      { title: "Asset Library — Inkline" },
      { name: "description", content: "Reusable characters, locations, outfits, props, panels and styles." },
      { property: "og:title", content: "Asset Library — Inkline" },
      { property: "og:description", content: "Reusable characters, locations, outfits, props, panels and styles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useCurrentProject();
  if (!project) return <><PageHeader title="Asset Library" description="Reusable characters, locations, outfits, props, panels and styles." /><ProjectGate /></>;
  return <AssetLibrary />;
}

type Tab = "characters" | "locations" | "panels" | "styles";

function AssetLibrary() {
  const project = useCurrentProject()!;
  const [tab, setTab] = useState<Tab>("characters");
  const [q, setQ] = useState("");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "characters", label: "Characters", count: project.characters.length },
    { key: "locations", label: "Locations", count: project.locations.length },
    { key: "panels", label: "Drawn panels", count: project.chapters.reduce((n, c) => n + c.scenes.reduce((m, s) => m + s.panels.filter((p) => p.imageUrl).length, 0), 0) },
    { key: "styles", label: "Style presets", count: project.styles.length },
  ];

  const filter = (text: string) => text.toLowerCase().includes(q.toLowerCase());

  return (
    <div>
      <PageHeader title="Asset Library" description="Reusable characters, locations, outfits, props, panels and styles." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <input
          className="ml-auto w-full max-w-xs rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {tab === "characters" && (
        project.characters.length === 0 ? (
          <EmptyState icon={<Icons.Users className="h-5 w-5" />} title="No characters" description="Create characters in the Character Studio." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {project.characters.filter((c) => filter(c.name + c.role + c.appearance)).map((c) => (
              <Panel key={c.id}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full violet-gradient text-sm font-bold text-primary-foreground">{c.name.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{[c.age, c.role].filter(Boolean).join(" · ") || "No role"}</div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{c.appearance || "No appearance description"}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.powers.slice(0, 3).map((p, i) => <Chip key={i} tone="primary">{p}</Chip>)}
                  {c.items.slice(0, 2).map((it, i) => <Chip key={i} tone="muted">{it}</Chip>)}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{c.outfits.length} outfits</div>
              </Panel>
            ))}
          </div>
        )
      )}

      {tab === "locations" && (
        project.locations.length === 0 ? (
          <EmptyState icon={<Icons.Globe2 className="h-5 w-5" />} title="No locations" description="Create locations in the World Studio." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {project.locations.filter((l) => filter(l.name + l.description + l.atmosphere)).map((l) => (
              <Panel key={l.id}>
                <div className="font-medium">{l.name}</div>
                <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{l.description || "No description"}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {l.lighting && <Chip tone="muted">{l.lighting}</Chip>}
                  {l.weather && <Chip tone="muted">{l.weather}</Chip>}
                  {l.objects.slice(0, 3).map((o, i) => <Chip key={i} tone="muted">{o}</Chip>)}
                </div>
              </Panel>
            ))}
          </div>
        )
      )}

      {tab === "panels" && (
        project.chapters.reduce((n, c) => n + c.scenes.reduce((m, s) => m + s.panels.filter((p) => p.imageUrl).length, 0), 0) === 0 ? (
          <EmptyState icon={<Icons.ImageIcon className="h-5 w-5" />} title="No drawn panels" description="Generate panel art in the Scene Director or Comic Editor." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {project.chapters.flatMap((c) => c.scenes.flatMap((s) => s.panels.filter((p) => p.imageUrl && filter(p.description + p.shot)).map((p) => (
              <div key={p.id} className="surface-card overflow-hidden">
                <div className={`overflow-hidden ${project.format === "manga" ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
                  <img src={p.imageUrl} alt={p.description} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <Chip tone="muted">{p.shot}</Chip>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description || "No description"}</p>
                </div>
              </div>
            ))))}
          </div>
        )
      )}

      {tab === "styles" && (
        project.styles.length === 0 ? (
          <EmptyState icon={<Icons.Palette className="h-5 w-5" />} title="No style presets" description="Create styles in the Art Studio." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {project.styles.filter((s) => filter(s.name)).map((s) => (
              <Panel key={s.id}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  {project.activeStyleId === s.id && <Chip tone="primary">Active</Chip>}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Chip tone="muted">{s.lineWeight}</Chip>
                  <Chip tone="muted">{s.shading}</Chip>
                  <Chip tone="muted">{s.colorTreatment}</Chip>
                  <Chip tone="muted">{s.lighting}</Chip>
                </div>
              </Panel>
            ))}
          </div>
        )
      )}
    </div>
  );
}
