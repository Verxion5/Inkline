import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import * as Icons from "lucide-react";

export const Route = createFileRoute("/_app")({ component: Layout });

function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em]">Loading Inkline…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
