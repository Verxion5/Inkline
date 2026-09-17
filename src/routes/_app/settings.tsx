import { createFileRoute } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { PageHeader, Panel, Chip, Section } from "@/components/app/kit";
import { useAuth } from "@/hooks/useAuth";
import { useDB, getSyncError } from "@/lib/store";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Inkline" },
      { name: "description", content: "Account, preferences, AI and export settings." },
      { property: "og:title", content: "Settings — Inkline" },
      { property: "og:description", content: "Account, preferences, AI and export settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, signOut } = useAuth();
  const db = useDB();
  const syncError = getSyncError();

  return (
    <div>
      <PageHeader title="Settings" description="Account, preferences, AI and export settings." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="space-y-4">
          <div className="font-display text-lg">Account</div>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full violet-gradient font-bold text-primary-foreground">
                  {(user.email ?? "IN").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="font-medium">{user.email}</div>
                  <div className="text-xs text-muted-foreground">User ID: {user.id.slice(0, 8)}…</div>
                </div>
              </div>
              <button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-destructive/60 hover:text-destructive">
                <Icons.LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Not signed in. You're working with local storage only — projects won't sync to the cloud.</p>
              <p className="text-xs">Sign in from the Lovable preview to enable cloud sync and persistent sessions.</p>
            </div>
          )}
        </Panel>

        <Panel className="space-y-4">
          <div className="font-display text-lg">Cloud sync</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              {syncError ? <Chip tone="danger">error</Chip> : user ? <Chip tone="success">connected</Chip> : <Chip tone="muted">offline</Chip>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Projects synced</span>
              <span>{db.projects.length}</span>
            </div>
            {syncError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{syncError}</div>}
          </div>
        </Panel>

        <Panel className="space-y-4">
          <div className="font-display text-lg">AI configuration</div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>The AI features (brain generation, chapter directing, conversational editing, image generation, art review) require a configured API key.</p>
            <p>Key status is checked at runtime — if AI features are disabled, add the LOVABLE_API_KEY secret in your environment settings.</p>
          </div>
        </Panel>

        <Panel className="space-y-4">
          <div className="font-display text-lg">Workspace</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total projects</span>
              <span>{db.projects.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Onboarded</span>
              <Chip tone={db.onboarded ? "success" : "muted"}>{db.onboarded ? "yes" : "no"}</Chip>
            </div>
          </div>
        </Panel>
      </div>

      <Section title="About Inkline">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Inkline is an AI-powered manga and manhwa creation studio. It plans panels, casts characters, and draws original artwork from a single line of story.
            All artwork is original — the AI never imitates living artists or copyrighted franchises.
          </p>
        </Panel>
      </Section>
    </div>
  );
}
