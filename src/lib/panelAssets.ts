import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "panels";
const TTL = 60 * 60 * 24 * 7; // 7 days

type CacheEntry = { url: string; expires: number };
const cache = new Map<string, CacheEntry>();

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head ?? "")?.[1] ?? "image/png";
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Persist a freshly generated panel render into the creator's private bucket.
 * Returns the storage key, or null if the user is signed out / storage refused.
 */
export async function uploadPanelImage(
  projectId: string,
  panelId: string,
  dataUrl: string,
): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const path = `${uid}/${projectId}/${panelId}-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, dataUrlToBlob(dataUrl), { contentType: "image/png", upsert: true });
  if (error) return null;
  return path;
}

export async function signedPanelUrl(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (error || !data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, expires: Date.now() + (TTL - 600) * 1000 });
  return data.signedUrl;
}

export async function deletePanelImages(paths: string[]) {
  if (paths.length === 0) return;
  paths.forEach((p) => cache.delete(p));
  await supabase.storage.from(BUCKET).remove(paths).catch?.(() => {});
}

/** Resolves a stored panel path (or a session data URL) into something renderable. */
export function usePanelImage(path: string | undefined, fallback?: string): string | null {
  const [url, setUrl] = useState<string | null>(fallback || null);

  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(fallback || null);
      return;
    }
    const hit = cache.get(path);
    if (hit && hit.expires > Date.now()) {
      setUrl(hit.url);
      return;
    }
    void signedPanelUrl(path).then((u) => {
      if (alive) setUrl(u ?? fallback ?? null);
    });
    return () => {
      alive = false;
    };
  }, [path, fallback]);

  return url;
}
