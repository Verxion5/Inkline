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

/* ---------------- cloud sync ---------------- */

let syncUserId: string | null = null;
let syncError: string | null = null;
const dirty = new Set<ID>();
let pushTimer: ReturnType<typeof setTimeout> | undefined;

export function getSyncError() {
  return syncError;
}

/** Called by the auth hook. Pulls the user's cloud projects and starts pushing changes. */
export function setSyncUser(id: string | null) {
  if (syncUserId === id) return;
  syncUserId = id;
  if (!id) return;
  hydrate();
  void (async () => {
    try {
      const { fetchRemoteProjects } = await import("./cloud");
      const remote = await fetchRemoteProjects();
      syncError = null;
      const byId = new Map(state.projects.map((p) => [p.id, p]));
      for (const r of remote) {
        const local = byId.get(r.id);
        if (!local || r.updatedAt >= local.updatedAt) byId.set(r.id, r);
      }
      // any local-only project belongs to this user now — push it up
      for (const p of byId.values()) if (!remote.some((r) => r.id === p.id)) dirty.add(p.id);
      const projects = [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
      state = { ...state, projects, currentId: state.currentId ?? projects[0]?.id ?? null };
      writeLocal();
      emit();
      schedulePush();
    } catch (e) {
      syncError = e instanceof Error ? e.message : "Cloud sync failed.";
      emit();
    }
  })();
}

function schedulePush() {
  if (!syncUserId || dirty.size === 0) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void (async () => {
      const uid = syncUserId;
      if (!uid) return;
      const ids = [...dirty];
      dirty.clear();
      try {
        const { pushRemoteProject } = await import("./cloud");
        for (const id of ids) {
          const p = state.projects.find((x) => x.id === id);
          if (p) await pushRemoteProject(uid, p);
        }
        syncError = null;
        setSaveStatus("saved");
      } catch (e) {
        ids.forEach((i) => dirty.add(i));
        syncError = e instanceof Error ? e.message : "Could not save to the cloud.";
      }
      emit();
    })();
  }, 700);
}

function writeLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — state stays in memory for this session */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  setSaveStatus("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => setSaveStatus("saved"), 420);
  writeLocal();
  schedulePush();
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
