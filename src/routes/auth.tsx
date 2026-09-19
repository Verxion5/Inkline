import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Field, TextInput } from "@/components/app/kit";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Inkline Studio" },
      { name: "description", content: "Sign in to your private Inkline workspace to keep every project, character and page." },
      { property: "og:title", content: "Sign in — Inkline Studio" },
      { property: "og:description", content: "Your private Inkline manga workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setMode("reset");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !window.location.hash.includes("type=recovery")) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to Inkline.");
        navigate({ to: "/", replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setNotice("Account created. If email confirmation is on, check your inbox to verify, then sign in.");
        toast.success("Account created.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setNotice("If that address has an account, a reset link is on its way.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated.");
        navigate({ to: "/", replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setNotice(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in is unavailable right now.");
    }
  }

  const titles: Record<Mode, string> = {
    signin: "Sign in to Inkline",
    signup: "Create your Inkline account",
    forgot: "Reset your password",
    reset: "Choose a new password",
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <div className="hero-glow relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl violet-gradient font-display text-xl text-primary-foreground">
            I
          </span>
          <span className="font-display text-xl">Inkline</span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-4xl leading-tight">A creative OS for manga and manhwa.</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Describe a series in plain language. Inkline builds the story brain, the cast, the world, the chapters and
            the artwork — and remembers all of it between sessions.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Original artwork direction · your work stays private
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl">{titles[mode]}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Your projects are private to your account."
              : mode === "forgot"
                ? "We'll email you a link to set a new password."
                : mode === "reset"
                  ? "Enter the new password for your account."
                  : "Pick up exactly where you left off."}
          </p>

          {mode !== "reset" && (
            <>
              <button
                onClick={google}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition hover:border-primary/60"
              >
                <Icons.Chrome className="h-4 w-4" /> Continue with Google
              </button>
              <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Display name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </Field>
            )}
            {mode !== "reset" && (
              <Field label="Email">
                <TextInput
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                />
              </Field>
            )}
            {mode !== "forgot" && (
              <Field label={mode === "reset" ? "New password" : "Password"}>
                <TextInput
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </Field>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg violet-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Update password"}
            </button>
          </form>

          {notice && <p className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{notice}</p>}

          <div className="mt-6 space-y-2 text-xs text-muted-foreground">
            {mode === "signin" && (
              <>
                <button className="hover:text-foreground" onClick={() => setMode("forgot")}>
                  Forgot your password?
                </button>
                <div>
                  New here?{" "}
                  <button className="text-primary-glow hover:underline" onClick={() => setMode("signup")}>
                    Create an account
                  </button>
                </div>
              </>
            )}
            {mode !== "signin" && (
              <button className="text-primary-glow hover:underline" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            )}
          </div>

          <Link to="/" className="mt-8 block text-xs text-muted-foreground hover:text-foreground">
            ← Back to the studio
          </Link>
        </div>
      </div>
    </div>
  );
}
