import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { EmptyState } from "./kit";

/** Shown by studio pages when no project is selected yet. */
export function ProjectGate() {
  return (
    <EmptyState
      icon={<Icons.FolderPlus className="h-5 w-5" />}
      title="No project selected"
      description="Every studio works on an active project. Create one from a plain-language description, or pick an existing series."
      action={
        <div className="flex gap-2">
          <Link to="/projects/new" className="rounded-lg violet-gradient px-4 py-2 text-sm text-primary-foreground">
            Create project
          </Link>
          <Link to="/projects" className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary/60">
            My projects
          </Link>
        </div>
      }
    />
  );
}
