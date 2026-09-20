/**
 * Client-side generation boundary for a single panel.
 * The provider key never leaves the server: this posts to /api/generate-image,
 * which owns the provider call. The result is uploaded to the creator's private
 * bucket and committed onto the project/chapter/page/panel record.
 */
import { compilePanelPrompt } from "./promptCompiler";
import { streamImage } from "./streamImage";
import { uploadPanelImage } from "./panelAssets";
import { commitPanelRender, patchPanel } from "./comic";
import type { ID, Panel, Project, Scene } from "./types";

export type ProviderStatus = { configured: boolean; message: string };

export async function getProviderStatus(): Promise<ProviderStatus> {
  try {
    const res = await fetch("/api/generate-image", { method: "GET" });
    if (!res.ok) return { configured: false, message: "Image generation status is unavailable." };
    const json = (await res.json()) as { configured?: boolean; message?: string };
    return {
      configured: Boolean(json.configured),
      message: json.message ?? "",
    };
  } catch {
    return { configured: false, message: "Could not reach the image service." };
  }
}

export type GenerateResult = { ok: true; prompt: string } | { ok: false; error: string };

export async function generatePanelArt(
  project: Project,
  chapterId: ID,
  page: Scene,
  panel: Panel,
  onPreview?: (dataUrl: string) => void,
): Promise<GenerateResult> {
  const compiled = compilePanelPrompt(project, page, panel);
  patchPanel(project.id, chapterId, page.id, panel.id, (p) => ({ ...p, status: "drawing", error: undefined }));

  let last: string | null = null;
  try {
    await streamImage(
      "/api/generate-image",
      {
        prompt: compiled.prompt,
        negative: compiled.negative,
        aspect: compiled.aspect,
        format: compiled.format,
        quality: compiled.quality,
      },
      (dataUrl) => {
        last = dataUrl;
        onPreview?.(dataUrl);
      },
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : "Generation failed.";
    patchPanel(project.id, chapterId, page.id, panel.id, (p) => ({ ...p, status: "error", error }));
    return { ok: false, error };
  }

  if (!last) {
    const error = "The provider returned no image. Try generating again.";
    patchPanel(project.id, chapterId, page.id, panel.id, (p) => ({ ...p, status: "error", error }));
    return { ok: false, error };
  }

  const path = await uploadPanelImage(project.id, panel.id, last);
  if (!path) {
    // Storage refused (signed out or quota). Keep the render for this session and say so.
    patchPanel(project.id, chapterId, page.id, panel.id, (p) => ({
      ...p,
      imageUrl: last!,
      status: "drawn",
      error: "Saved for this session only — the artwork could not be stored.",
    }));
    return { ok: false, error: "Artwork generated but could not be saved to your library." };
  }

  commitPanelRender(project.id, chapterId, page.id, panel.id, { path, prompt: compiled.prompt });
  return { ok: true, prompt: compiled.prompt };
}
