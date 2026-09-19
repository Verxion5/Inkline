import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { NAV, navTitle } from "@/lib/nav";
import { useDB, useCurrentProject, useSaveStatus, setCurrentProject } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { checkChapter } from "@/lib/continuity";

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <Cmp className={className} aria-hidden />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = navTitle(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pathname={pathname} className="hidden lg:flex" />
      {mobileOpen && (
        <>
          <button
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          />
          <Sidebar pathname={pathname} className="z-50 flex lg:hidden" />
        </>
      )}

      <div className="lg:pl-[264px]">
        <TopBar crumbs={crumbs} onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="min-h-[calc(100vh-56px-34px)] px-5 py-7 md:px-8 md:py-9">{children}</main>
        <StatusBar />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function Sidebar({ pathname, className }: { pathname: string; className?: string }) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-[264px] flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <Link to="/" className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl violet-gradient font-display text-lg text-primary-foreground shadow-[0_8px_20px_-8px_oklch(0.62_0.208_295)]">
          I
        </span>
        <span>
          <span className="block font-display text-lg leading-none">Inkline</span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Manga Creative OS
          </span>
        </span>
      </Link>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.description}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--primary)]"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn("h-4 w-4 shrink-0", active ? "text-primary-glow" : "text-muted-foreground")}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <ProjectSwitcher />
    </aside>
  );
}

function ProjectSwitcher() {
  const db = useDB();
  const current = useCurrentProject();
  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="mb-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70">
        Active project
      </div>
      {db.projects.length === 0 ? (
        <Link
          to="/projects/new"
          className="flex items-center gap-2 rounded-lg border border-dashed border-sidebar-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
        >
          <Icons.Plus className="h-4 w-4" /> New project
        </Link>
      ) : (
        <select
          value={current?.id ?? ""}
          onChange={(e) => setCurrentProject(e.target.value)}
          className="w-full rounded-lg border border-sidebar-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {db.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function TopBar({
  crumbs,
  onMenu,
  onSearch,
}: {
  crumbs: { section: string; page: string };
  onMenu: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
      <button
        onClick={onMenu}
        aria-label="Open navigation"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Icons.Menu className="h-4 w-4" />
      </button>

      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        <span>{crumbs.section}</span>
        <Icons.ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{crumbs.page}</span>
      </div>

      <button
        onClick={onSearch}
        className="ml-auto flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-input px-3 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
      >
        <Icons.Search className="h-4 w-4" />
        <span className="truncate">Search projects, characters, places…</span>
        <kbd className="ml-auto hidden font-mono text-[10px] text-muted-foreground md:block">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1">
        <Notifications />
        <Link
          to="/settings"
          title="Help & settings"
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icons.LifeBuoy className="h-4 w-4" />
        </Link>
        <AccountMenu />
      </div>
    </header>
  );
}

function Notifications() {
  const project = useCurrentProject();
  const issues = useMemo(() => {
    if (!project) return [] as string[];
    const out: string[] = [];
    for (const ch of project.chapters) for (const i of checkChapter(project, ch)) out.push(`Ch.${ch.number}: ${i.message}`);
    return [...new Set(out)].slice(0, 6);
  }, [project]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Icons.Bell className="h-4 w-4" />
        {issues.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Studio alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {issues.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">Nothing needs your attention right now.</div>
        ) : (
          issues.map((i) => (
            <div key={i} className="px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
              {i}
            </div>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/continuity">Open Continuity Center</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "IN").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="grid h-9 w-9 place-items-center rounded-full violet-gradient text-xs font-semibold text-primary-foreground"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
          {user?.email ?? "Signed in"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">Profile & settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/projects">My projects</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await signOut();
            navigate({ to: "/auth", replace: true });
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBar() {
  const status = useSaveStatus();
  const project = useCurrentProject();
  const label = status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Up to date";
  return (
    <footer className="sticky bottom-0 flex h-[34px] items-center gap-4 border-t border-border bg-background/90 px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur md:px-8">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "saving" ? "animate-pulse bg-warning" : "bg-success",
          )}
        />
        {label}
      </span>
      <span className="hidden truncate sm:block">{project ? project.title : "No project selected"}</span>
      <span className="ml-auto hidden md:block">Inkline Studio · local workspace</span>
    </footer>
  );
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const navigate = useNavigate();
  const project = useCurrentProject();

  const entries = useMemo(() => {
    const characters = (project?.characters ?? []).map((c) => ({ id: c.id, name: c.name, to: "/characters" }));
    const locations = (project?.locations ?? []).map((l) => ({ id: l.id, name: l.name, to: "/world" }));
    const chapters = (project?.chapters ?? []).map((c) => ({
      id: c.id,
      name: `Ch. ${c.number} — ${c.title}`,
      to: "/chapters",
    }));
    return { characters, locations, chapters };
  }, [project]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search Inkline…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV.flatMap((g) => g.items).map((item) => (
            <CommandItem key={item.to} value={`${item.label} ${item.description}`} onSelect={() => go(item.to)}>
              <Icon name={item.icon} className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {db.projects.length > 0 && (
          <CommandGroup heading="Projects">
            {db.projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project ${p.title}`}
                onSelect={() => {
                  setCurrentProject(p.id);
                  go("/story");
                }}
              >
                <Icons.BookMarked className="mr-2 h-4 w-4" />
                {p.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {entries.characters.length > 0 && (
          <CommandGroup heading="Characters">
            {entries.characters.map((c) => (
              <CommandItem key={c.id} value={`character ${c.name}`} onSelect={() => go(c.to)}>
                <Icons.User className="mr-2 h-4 w-4" />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {entries.locations.length > 0 && (
          <CommandGroup heading="Locations">
            {entries.locations.map((l) => (
              <CommandItem key={l.id} value={`location ${l.name}`} onSelect={() => go(l.to)}>
                <Icons.MapPin className="mr-2 h-4 w-4" />
                {l.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {entries.chapters.length > 0 && (
          <CommandGroup heading="Chapters">
            {entries.chapters.map((c) => (
              <CommandItem key={c.id} value={`chapter ${c.name}`} onSelect={() => go(c.to)}>
                <Icons.Layers className="mr-2 h-4 w-4" />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
