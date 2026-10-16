import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Field, TextInput } from "@/components/app/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Account & Settings — Inkline" },
      { name: "description", content: "Manage your Inkline profile, password and session." },
      { property: "og:title", content: "Account & Settings — Inkline" },
      { property: "og:description", content: "Manage your Inkline profile, password and session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState<"" | "profile" | "password" | "out">("");

  useEffect(() => {
    setName((user?.user_metadata?.display_name as string) ?? (user?.user_metadata?.full_name as string) ?? "");
  }, [user]);

  const isEmailUser = user?.app_metadata?.provider === "email";

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy("profile");
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    setBusy("");
    if (error) toast.error(error.message);
    else toast.success("Profile saved.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as never);
    setBusy("");
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      setCurrent("");
      setNext("");
    }
  }

  async function out() {
    setBusy("out");
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Account & Settings" description="Your profile, password and session." />

      <Panel>
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full violet-gradient font-display text-lg text-primary-foreground">
            {(name || user?.email || "?").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="font-display text-lg">{name || "Unnamed creator"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Signed in with {isEmailUser ? "email" : user?.app_metadata?.provider ?? "—"}
              {user?.email_confirmed_at ? " · email verified" : " · email not verified"}
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <form onSubmit={saveProfile} className="max-w-md space-y-4">
          <div className="font-display text-lg">Profile</div>
          <Field label="Display name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} />
          </Field>
          <button disabled={busy === "profile"} className="flex items-center gap-2 rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {busy === "profile" && <Icons.Loader2 className="h-4 w-4 animate-spin" />} Save profile
          </button>
        </form>
      </Panel>

      {isEmailUser && (
        <Panel>
          <form onSubmit={changePassword} className="max-w-md space-y-4">
            <div className="font-display text-lg">Change password</div>
            <Field label="Current password">
              <TextInput type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password">
              <TextInput type="password" required minLength={6} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <button disabled={busy === "password"} className="flex items-center gap-2 rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">
              {busy === "password" && <Icons.Loader2 className="h-4 w-4 animate-spin" />} Update password
            </button>
          </form>
        </Panel>
      )}

      <Panel>
        <div className="font-display text-lg">Session</div>
        <p className="mt-1 text-sm text-muted-foreground">Your projects are private to this account and stay saved after you sign out.</p>
        <button onClick={out} disabled={busy === "out"} className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-destructive/60">
          <Icons.LogOut className="h-4 w-4" /> Sign out
        </button>
      </Panel>
    </div>
  );
}
