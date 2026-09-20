/**
 * Chapter → Page → Panel operations on the persisted project model.
 * A "Page" is a Scene in the data model; the UI calls it a page because that is
 * what creators compose. Every mutation goes through `updateProject`, so the
 * store's autosave + cloud sync pick it up automatically.
 */
import { newChapter, newPanel, newScene, uid } from "./factories";
import { updateProject } from "./store";
import type { Chapter, ID, Panel, PanelVersion, Project, Scene } from "./types";

export function chapterOf(project: Project, chapterId: ID | null | undefined): Chapter | undefined {
  return project.chapters.find((c) => c.id === chapterId);
}

export function pageOf(chapter: Chapter | undefined, pageId: ID | null | undefined): Scene | undefined {
  return chapter?.scenes.find((s) => s.id === pageId);
}

export function addChapter(projectId: ID, title?: string): ID {
  const id = uid("cha");
  updateProject(projectId, (p) => {
    const number = p.chapters.length + 1;
    const chapter = newChapter({
      id,
      number,
      title: title?.trim() || `Chapter ${number}`,
      scenes: [newScene({ title: "Page 1" })],
    });
    return { ...p, chapters: [...p.chapters, chapter] };
  });
  return id;
}

export function renameChapter(projectId: ID, chapterId: ID, title: string) {
  updateProject(projectId, (p) => ({
    ...p,
    chapters: p.chapters.map((c) => (c.id === chapterId ? { ...c, title } : c)),
  }));
}

export function removeChapter(projectId: ID, chapterId: ID) {
  updateProject(projectId, (p) => ({
    ...p,
    chapters: p.chapters
      .filter((c) => c.id !== chapterId)
      .map((c, i) => ({ ...c, number: i + 1 })),
  }));
}

export function addPage(projectId: ID, chapterId: ID): ID {
  const id = uid("scn");
  updateProject(projectId, (p) => ({
    ...p,
    chapters: p.chapters.map((c) =>
      c.id === chapterId
        ? { ...c, scenes: [...c.scenes, newScene({ id, title: `Page ${c.scenes.length + 1}` })] }
        : c,
    ),
  }));
  return id;
}

export function updatePage(projectId: ID, chapterId: ID, pageId: ID, fn: (s: Scene) => Scene) {
  updateProject(projectId, (p) => ({
    ...p,
    chapters: p.chapters.map((c) =>
      c.id === chapterId ? { ...c, scenes: c.scenes.map((s) => (s.id === pageId ? fn(s) : s)) } : c,
    ),
  }));
}

export function removePage(projectId: ID, chapterId: ID, pageId: ID) {
  updateProject(projectId, (p) => ({
    ...p,
    chapters: p.chapters.map((c) =>
      c.id === chapterId ? { ...c, scenes: c.scenes.filter((s) => s.id !== pageId) } : c,
    ),
  }));
}

export function addPanel(projectId: ID, chapterId: ID, pageId: ID, partial: Partial<Panel> = {}): ID {
  const id = uid("pnl");
  updatePage(projectId, chapterId, pageId, (s) => ({ ...s, panels: [...s.panels, newPanel({ id, ...partial })] }));
  return id;
}

export function patchPanel(projectId: ID, chapterId: ID, pageId: ID, panelId: ID, fn: (p: Panel) => Panel) {
  updatePage(projectId, chapterId, pageId, (s) => ({
    ...s,
    panels: s.panels.map((pn) => (pn.id === panelId ? fn(pn) : pn)),
  }));
}

export function removePanel(projectId: ID, chapterId: ID, pageId: ID, panelId: ID) {
  updatePage(projectId, chapterId, pageId, (s) => ({ ...s, panels: s.panels.filter((pn) => pn.id !== panelId) }));
}

export function movePanel(projectId: ID, chapterId: ID, pageId: ID, panelId: ID, delta: number) {
  updatePage(projectId, chapterId, pageId, (s) => {
    const i = s.panels.findIndex((pn) => pn.id === panelId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= s.panels.length) return s;
    const panels = [...s.panels];
    const [moved] = panels.splice(i, 1);
    panels.splice(j, 0, moved!);
    return { ...s, panels };
  });
}

/** Records a new render as the current art and keeps the previous ones as history. */
export function commitPanelRender(
  projectId: ID,
  chapterId: ID,
  pageId: ID,
  panelId: ID,
  version: { path: string; prompt: string },
) {
  patchPanel(projectId, chapterId, pageId, panelId, (pn) => {
    const entry: PanelVersion = { id: uid("ver"), path: version.path, prompt: version.prompt, createdAt: Date.now() };
    const versions = [entry, ...(pn.versions ?? [])].slice(0, 8);
    return { ...pn, imagePath: entry.path, imageUrl: "", versions, status: "drawn", error: undefined };
  });
}

export function restorePanelVersion(projectId: ID, chapterId: ID, pageId: ID, panelId: ID, versionId: ID) {
  patchPanel(projectId, chapterId, pageId, panelId, (pn) => {
    const v = (pn.versions ?? []).find((x) => x.id === versionId);
    if (!v) return pn;
    return { ...pn, imagePath: v.path, imageUrl: "", status: "drawn", error: undefined };
  });
}

export function countPanels(project: Project): number {
  return project.chapters.reduce(
    (n, c) => n + c.scenes.reduce((m, s) => m + s.panels.length, 0),
    0,
  );
}

export function countDrawn(project: Project): number {
  return project.chapters.reduce(
    (n, c) => n + c.scenes.reduce((m, s) => m + s.panels.filter((p) => p.imagePath || p.imageUrl).length, 0),
    0,
  );
}
