import { supabase } from "./supabase";

export function isNativeImagePath(value?: string | null) {
  if (!value) return false;
  return /\.(avif|gif|heic|heif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value);
}

export function nativePublicMediaUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const objectPath = raw.replace(/^\/?request-media\//i, "").replace(/^\/+/, "");
  if (!objectPath) return undefined;
  return supabase.storage.from("request-media").getPublicUrl(objectPath).data.publicUrl;
}

export async function nativeSignedPostMediaUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const objectPath = raw.replace(/^\/?request-media\//i, "").replace(/^\/+/, "");
  if (!objectPath) return undefined;
  const { data } = await supabase.storage.from("request-media").createSignedUrl(objectPath, 60 * 60);
  return data?.signedUrl;
}

export function isNativeVideoPath(value?: string | null) {
  if (!value) return false;
  return /\.(m4v|mov|mp4|webm)(?:[?#].*)?$/i.test(value);
}

export function withMediaRetry(url: string, attempt: number) {
  if (!attempt) return url;
  return `${url}${url.includes("?") ? "&" : "?"}bridgex_retry=${attempt}`;
}
