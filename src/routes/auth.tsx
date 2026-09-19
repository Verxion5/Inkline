import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({ component: AuthPage });

type Mode = "signin" | "signup" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Reset link sent", { description: "Check your inbox for a password reset email." });
        setMode("signin");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Account created", {
          description: "Check your inbox to confirm your email, then sign in.",
        });
        setMode("signin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Mode, { eyebrow: string; title: string; sub: string }> = {
    signin: { eyebrow: "Welcome back", title: "Sign in to Inkline", sub: "Continue building your studio." },
    signup: { eyebrow: "Get started", title: "Create your account", sub: "Start directing manga from a single line." },
    reset: { eyebrow: "Recover access", title: "Reset your password", sub: "We'll send a reset link to your email." },
  };
  const t = titles[mode];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl violet-gradient font-display text-xl text-primary-foreground shadow-[0_8px_20px_-8px_oklch(0.62_0.208_295)]">
            I
          </span>
          <span>
            <span className="block font-display text-2xl leading-none">Inkline</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Manga Creative OS
            </span>
          </span>
        </div>

        <div className="surface-card p-7">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {t.eyebrow}
          </div>
          <h1 className="font-display text-2xl leading-tight">{t.title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.sub}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Email
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="you@example.com"
              />
            </label>

            {mode !== "reset" && (
              <label className="block">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Password
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder="••••••••"
                />
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <Icons.AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg violet-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground">
                Already have an account? <span className="text-primary-glow">Sign in</span>
              </button>
            )}
            {mode !== "signup" && (
              <button onClick={() => setMode("signup")} className="text-muted-foreground hover:text-foreground">
                New here? <span className="text-primary-glow">Create an account</span>
              </button>
            )}
            {mode !== "reset" && (
              <button
                onClick={() => setMode("reset")}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Inkline Studio · your work is saved to your account
        </p>
      </div>
    </div>
  );
}
