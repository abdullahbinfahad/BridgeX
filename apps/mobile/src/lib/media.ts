import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import { supabase } from "./supabase";

export type NativeMediaAsset = Pick<ImagePickerAsset, "uri" | "fileName" | "mimeType" | "type" | "fileSize">;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

/** Compresses still images locally; video is size-limited because the Expo managed runtime does not re-encode video reliably on-device. */
export async function uploadNativePostMedia(userId: string, assets: NativeMediaAsset[]) {
  if (assets.length > 6) throw new Error("Choose up to five images and one short video.");
  const imageCount = assets.filter(asset => asset.type === "image").length;
  const videoCount = assets.filter(asset => asset.type === "video").length;
  if (imageCount > 5 || videoCount > 1) throw new Error("Choose up to five images and one short video.");
  const paths: string[] = [];
  for (const asset of assets) {
    if (asset.type === "video" && Number(asset.fileSize ?? 0) > MAX_VIDEO_BYTES) throw new Error("Choose a video below 12 MB.");
    const prepared = asset.type === "image" ? await ImageManipulator.manipulateAsync(asset.uri, [], { compress: 0.64, format: ImageManipulator.SaveFormat.JPEG }) : { uri: asset.uri };
    const response = await fetch(prepared.uri);
    const buffer = await response.arrayBuffer();
    const extension = asset.type === "image" ? "jpg" : asset.fileName?.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await supabase.storage.from("request-media").upload(path, buffer, { contentType: asset.type === "image" ? "image/jpeg" : asset.mimeType || "video/mp4", upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function uploadNativeVerificationDocument(userId: string, kind: "national_id" | "passport" | "student_id", asset: { uri: string; name?: string | null; mimeType?: string | null; size?: number | null }) {
  const isImage = asset.mimeType?.startsWith("image/");
  const prepared = isImage ? await ImageManipulator.manipulateAsync(asset.uri, [], { compress: 0.64, format: ImageManipulator.SaveFormat.JPEG }) : { uri: asset.uri };
  const response = await fetch(prepared.uri);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 5 * 1024 * 1024) throw new Error(`${kind.replace(/_/g, " ")} must be below 5 MB after compression.`);
  const extension = isImage ? "jpg" : asset.name?.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabase.storage.from("verification-documents").upload(path, buffer, { contentType: isImage ? "image/jpeg" : asset.mimeType || "application/pdf", upsert: false });
  if (error) throw error;
  return path;
}

export async function uploadNativeProfileAvatar(userId: string, asset: { uri: string; name?: string | null; mimeType?: string | null }) {
  if (!asset.mimeType?.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WEBP profile image.");
  const prepared = await ImageManipulator.manipulateAsync(asset.uri, [], { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG });
  const response = await fetch(prepared.uri);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 2 * 1024 * 1024) throw new Error("Profile image is still larger than 2 MB after compression.");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("profile-avatars").upload(path, buffer, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}

export async function uploadNativePaymentProof(userId: string, paymentId: string, asset: { uri: string; name?: string | null; mimeType?: string | null }) {
  if (!asset.mimeType?.startsWith("image/")) throw new Error("Choose a clear payment screenshot image.");
  const prepared = await ImageManipulator.manipulateAsync(asset.uri, [], { compress: 0.64, format: ImageManipulator.SaveFormat.JPEG });
  const response = await fetch(prepared.uri);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 3 * 1024 * 1024) throw new Error("Choose a smaller clear screenshot below 3 MB after compression.");
  const path = `${userId}/${paymentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("payment-proofs").upload(path, buffer, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}
