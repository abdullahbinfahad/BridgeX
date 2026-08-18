const MAX_DIMENSION = 1600;

/** Compresses browser-selected images before a private Supabase Storage upload. */
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

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.76));
    if (!blob) return file;

    const compressed = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-compressed.jpg`, { type: "image/jpeg" });
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(source);
  }
}
