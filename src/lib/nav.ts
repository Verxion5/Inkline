export type NavItem = {
  label: string;
  to: string;
  icon: string;
  description: string;
};

export type NavGroup = { title: string; items: NavItem[] };

/** Icon names map to lucide-react icons resolved in the sidebar. */
export const NAV: NavGroup[] = [
  {
    title: "Home",
    items: [
      { label: "Dashboard", to: "/", icon: "LayoutDashboard", description: "Overview of your studio" },
      { label: "My Projects", to: "/projects", icon: "FolderOpen", description: "All series and drafts" },
    ],
  },
  {
    title: "Create",
    items: [
      { label: "Story Studio", to: "/story", icon: "BookOpen", description: "Premise, arcs and themes" },
      { label: "Character Studio", to: "/characters", icon: "Users", description: "The character bible" },
      { label: "World Studio", to: "/world", icon: "Globe2", description: "The world bible" },
      { label: "Chapter Studio", to: "/chapters", icon: "Layers", description: "Arcs, chapters, scenes" },
      { label: "Scene Director", to: "/director", icon: "Clapperboard", description: "Plan panels before drawing" },
      { label: "Comic Editor", to: "/editor", icon: "PanelsTopLeft", description: "Draw and edit the pages" },
    ],
  },
  {
    title: "AI & Knowledge",
    items: [
      { label: "Story Genome", to: "/genome", icon: "Brain", description: "Persistent project memory" },
      { label: "AI Command Center", to: "/command", icon: "Sparkles", description: "Edit by talking" },
      { label: "Timeline", to: "/timeline", icon: "History", description: "Chronology and state" },
      { label: "Continuity Center", to: "/continuity", icon: "ShieldAlert", description: "Detected story conflicts" },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Art Studio", to: "/art", icon: "Palette", description: "Style DNA and rendering" },
      { label: "Asset Library", to: "/assets", icon: "Library", description: "Reusable elements" },
    ],
  },
  {
    title: "Output",
    items: [{ label: "Export & Publish", to: "/export", icon: "Share2", description: "Pages, PDF and packages" }],
  },
  {
    title: "Settings",
    items: [{ label: "Settings", to: "/settings", icon: "Settings", description: "Account and preferences" }],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);

export function navTitle(pathname: string): { section: string; page: string } {
  for (const group of NAV) {
    for (const item of group.items) {
      if (item.to === pathname || (item.to !== "/" && pathname.startsWith(item.to))) {
        return { section: group.title, page: item.label };
      }
    }
  }
  return { section: "Home", page: "Dashboard" };
}
