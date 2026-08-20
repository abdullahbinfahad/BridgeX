const MAX_DIMENSION = 1080;
export const MAX_REPORT_EVIDENCE_BYTES = 700 * 1024;
const REPORT_EVIDENCE_MAX_DIMENSION = 720;
const MAX_VIDEO_SECONDS = 45;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

/** Compresses browser-selected images before a Supabase Storage upload. */
export async function compressImageForUpload(file: File) {
  if (!file.type.startsWith("image/")) return file;

  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const longestSide = Math.max(image.width, image.height);
    const scale = Math.min(1, MAX_DIMENSION / longestSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.64));
    if (!blob) return file;
    const compressed = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-compressed.jpg`, { type: "image/jpeg" });
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(source);
  }
}

/** Creates a deliberately small JPEG evidence copy for safety reports without storing originals. */
export async function compressReportEvidenceImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const longestSide = Math.max(image.width, image.height);
    const scale = Math.min(1, REPORT_EVIDENCE_MAX_DIMENSION / longestSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let best: Blob | null = null;
    for (const quality of [0.5, 0.42, 0.34, 0.28]) {
      const candidate = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!candidate) continue;
      if (!best || candidate.size < best.size) best = candidate;
      if (candidate.size <= MAX_REPORT_EVIDENCE_BYTES) break;
    }
    if (!best) return file;
    return new File([best], `${file.name.replace(/\.[^.]+$/, "")}-evidence.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(source);
  }
}

function readVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("BridgeX could not read this video file.")); };
    video.src = url;
  });
}

/**
 * Re-encodes short browser-supported video into a low-bitrate WebM clip when possible.
 * Unsupported browsers retain the source clip but still enforce strict size and duration limits.
 */
export async function compressVideoForUpload(file: File) {
  if (!file.type.startsWith("video/")) return file;
  const duration = await readVideoDuration(file);
  if (!Number.isFinite(duration) || duration > MAX_VIDEO_SECONDS) throw new Error("Video must be 45 seconds or shorter.");
  if (file.size > 30 * 1024 * 1024) throw new Error("Video is too large to prepare. Choose a clip below 30 MB.");
  if (!("MediaRecorder" in window)) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("This browser cannot compress the video. Choose an MP4 or WebM file below 12 MB.");
    return file;
  }

  const source = URL.createObjectURL(file);
  try {
    const video = document.createElement("video") as HTMLVideoElement & { captureStream?: () => MediaStream };
    video.src = source;
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error("BridgeX could not prepare this video.")); });
    const stream = video.captureStream?.();
    if (!stream) {
      if (file.size > MAX_VIDEO_BYTES) throw new Error("This browser cannot compress the video. Choose an MP4 or WebM file below 12 MB.");
      return file;
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 650_000, audioBitsPerSecond: 64_000 });
    const stopped = new Promise<void>((resolve, reject) => { recorder.onstop = () => resolve(); recorder.onerror = () => reject(new Error("Video compression did not complete.")); });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    video.onended = () => recorder.state !== "inactive" && recorder.stop();
    recorder.start(500);
    await video.play();
    await stopped;
    const compressed = new File([new Blob(chunks, { type: mimeType })], `${file.name.replace(/\.[^.]+$/, "")}-compressed.webm`, { type: mimeType });
    const result = compressed.size < file.size ? compressed : file;
    if (result.size > MAX_VIDEO_BYTES) throw new Error("Video is still larger than 12 MB after compression. Choose a shorter clip.");
    return result;
  } finally {
    URL.revokeObjectURL(source);
  }
}

export type PreparedPostMedia = { file: File; kind: "image" | "video" };

export type MediaFileIdentity = { name: string; size: number; lastModified: number };

/** Appends newly selected files while ignoring the exact same browser file selection. */
export function appendUniqueMedia<T extends MediaFileIdentity>(existing: T[], incoming: T[]) {
  const seen = new Set(existing.map(file => `${file.name}:${file.size}:${file.lastModified}`));
  return [...existing, ...incoming.filter(file => {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })];
}

export function validatePostMediaSelection(files: Array<{ type: string }>) {
  const images = files.filter(file => file.type.startsWith("image/"));
  const videos = files.filter(file => file.type.startsWith("video/"));
  if (files.length !== images.length + videos.length) return "Choose only JPG, PNG, WEBP, MP4, or WebM files.";
  if (images.length > 5) return "Choose up to five images.";
  if (videos.length > 1) return "Choose only one short video.";
  return null;
}

/** Limits a post gallery to five compressed images and one short compressed video. */
export async function preparePostMedia(files: File[]): Promise<PreparedPostMedia[]> {
  const images = files.filter(file => file.type.startsWith("image/")).slice(0, 5);
  const video = files.find(file => file.type.startsWith("video/"));
  const selectionError = validatePostMediaSelection(files);
  if (selectionError) throw new Error(selectionError);
  const preparedImages = await Promise.all(images.map(async file => ({ file: await compressImageForUpload(file), kind: "image" as const })));
  const preparedVideo = video ? [{ file: await compressVideoForUpload(video), kind: "video" as const }] : [];
  return [...preparedImages, ...preparedVideo];
}
