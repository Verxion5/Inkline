import { supabase } from "@/integrations/supabase/client";
import type { Project } from "./types";

/** Cloud persistence for projects (one row per project, owned by the signed-in user). */

export async function fetchRemoteProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from("projects").select("id, data, updated_at");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => row.data as unknown as Project)
    .filter((p): p is Project => Boolean(p && typeof p === "object" && p.id));
}

export async function pushRemoteProject(userId: string, project: Project): Promise<void> {
  const { error } = await supabase.from("projects").upsert({
    id: project.id,
    user_id: userId,
    title: project.title,
    data: project as unknown as Record<string, unknown>,
  });
  if (error) throw new Error(error.message);
}

export async function deleteRemoteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
