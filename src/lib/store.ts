import { useCallback, useSyncExternalStore } from "react";
import type { Chapter, Character, DB, ID, Location, Panel, Project, Scene, StyleDNA } from "./types";
import { newProject } from "./factories";

const KEY = "inkline.v1";

const EMPTY: DB = { projects: [], onboarded: false, currentId: null };

let state: DB = EMPTY;
let snapshot: DB = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

export type SaveStatus = "idle" | "saving" | "saved";
let saveStatus: SaveStatus = "idle";
const saveListeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function setSaveStatus(s: SaveStatus) {
  saveStatus = s;
  saveListeners.forEach((l) => l());
}

export function useSaveStatus(): SaveStatus {
  return useSyncExternalStore(
    (cb) => {
      saveListeners.add(cb);
      return () => saveListeners.delete(cb);
    },
    () => saveStatus,
    () => "idle" as SaveStatus,
  );
}

function persist() {
  if (typeof window === "undefined") return;
  setSaveStatus("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => setSaveStatus("saved"), 420);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — state stays in memory for this session */
  }
}

function emit() {
  snapshot = { ...state };
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && Array.isArray(parsed.projects))
        state = {
          projects: parsed.projects,
          onboarded: parsed.onboarded ?? false,
          currentId: parsed.currentId ?? parsed.projects[0]?.id ?? null,
        };
    }
  } catch {
    /* corrupt payload — start clean */
  }
  emit();
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDB(): DB {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function useProject(id: string | undefined): Project | undefined {
  const db = useDB();
  return db.projects.find((p) => p.id === id);
}

/** Mutate the whole DB. */
export function setDB(fn: (db: DB) => DB) {
  state = fn(state);
  persist();
  emit();
}

/** Mutate one project immutably; bumps updatedAt. */
export function updateProject(id: ID, fn: (p: Project) => Project) {
  setDB((db) => ({
    ...db,
    projects: db.projects.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p)),
  }));
}

export function useProjectActions(id: ID) {
  const patch = useCallback((fn: (p: Project) => Project) => updateProject(id, fn), [id]);

  return {
    patch,
    setFields: (fields: Partial<Project>) => patch((p) => ({ ...p, ...fields })),

    upsertCharacter: (c: Character) =>
      patch((p) => ({
        ...p,
        characters: p.characters.some((x) => x.id === c.id)
          ? p.characters.map((x) => (x.id === c.id ? c : x))
          : [...p.characters, c],
      })),
    removeCharacter: (cid: ID) =>
      patch((p) => ({ ...p, characters: p.characters.filter((c) => c.id !== cid) })),

    upsertLocation: (l: Location) =>
      patch((p) => ({
        ...p,
        locations: p.locations.some((x) => x.id === l.id)
          ? p.locations.map((x) => (x.id === l.id ? l : x))
          : [...p.locations, l],
      })),
    removeLocation: (lid: ID) =>
      patch((p) => ({ ...p, locations: p.locations.filter((l) => l.id !== lid) })),

    upsertStyle: (s: StyleDNA) =>
      patch((p) => ({
        ...p,
        styles: p.styles.some((x) => x.id === s.id) ? p.styles.map((x) => (x.id === s.id ? s : x)) : [...p.styles, s],
      })),
    removeStyle: (sid: ID) =>
      patch((p) => ({
        ...p,
        styles: p.styles.filter((s) => s.id !== sid),
        activeStyleId: p.activeStyleId === sid ? (p.styles.find((s) => s.id !== sid)?.id ?? null) : p.activeStyleId,
      })),

    upsertChapter: (c: Chapter) =>
      patch((p) => ({
        ...p,
        chapters: p.chapters.some((x) => x.id === c.id)
          ? p.chapters.map((x) => (x.id === c.id ? c : x))
          : [...p.chapters, c],
      })),
    removeChapter: (cid: ID) => patch((p) => ({ ...p, chapters: p.chapters.filter((c) => c.id !== cid) })),

    updateScene: (chapterId: ID, sceneId: ID, fn: (s: Scene) => Scene) =>
      patch((p) => ({
        ...p,
        chapters: p.chapters.map((c) =>
          c.id === chapterId ? { ...c, scenes: c.scenes.map((s) => (s.id === sceneId ? fn(s) : s)) } : c,
        ),
      })),

    updatePanel: (chapterId: ID, sceneId: ID, panelId: ID, fn: (pnl: Panel) => Panel) =>
      patch((p) => ({
        ...p,
        chapters: p.chapters.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                scenes: c.scenes.map((s) =>
                  s.id === sceneId ? { ...s, panels: s.panels.map((pn) => (pn.id === panelId ? fn(pn) : pn)) } : s,
                ),
              }
            : c,
        ),
      })),
  };
}

export function createProject(partial: Partial<Project> = {}): Project {
  const project = newProject(partial);
  setDB((db) => ({ ...db, projects: [project, ...db.projects], currentId: project.id }));
  return project;
}

export function deleteProject(id: ID) {
  setDB((db) => {
    const projects = db.projects.filter((p) => p.id !== id);
    return { ...db, projects, currentId: db.currentId === id ? (projects[0]?.id ?? null) : db.currentId };
  });
}

export function setCurrentProject(id: ID | null) {
  setDB((db) => ({ ...db, currentId: id }));
}

export function useCurrentProject(): Project | undefined {
  const db = useDB();
  return db.projects.find((p) => p.id === db.currentId) ?? db.projects[0];
}

export function markOnboarded() {
  setDB((db) => ({ ...db, onboarded: true }));
}

/** Direct (non-hook) read for imperative code paths. */
export function getProject(id: ID): Project | undefined {
  return state.projects.find((p) => p.id === id);
}
