import heic2any from "heic2any";
import { toast } from "sonner";

/**
 * Check if a file is a HEIC/HEIF image
 */
export function isHeicFile(file: File): boolean {
  const extension = file.name.toLowerCase().split(".").pop();
  const isHeicExtension = extension === "heic" || extension === "heif";
  const isHeicMime = file.type === "image/heic" || file.type === "image/heif";
  
  return isHeicExtension || isHeicMime;
}

/**
 * Convert a HEIC file to JPEG
 * @param file - The HEIC file to convert
 * @returns A new File object in JPEG format
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const toastId = toast.loading("Conversion de l'image HEIC en cours...");
  
  try {
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // heic2any can return an array of blobs for multi-image HEIC files
    const blob = Array.isArray(result) ? result[0] : result;

    // Create a new filename with .jpg extension
    const originalName = file.name.replace(/\.(heic|heif)$/i, "");
    const newFileName = `${originalName}.jpg`;

    // Create a new File object
    const convertedFile = new File([blob], newFileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    toast.success("Image HEIC convertie avec succès", { id: toastId });
    return convertedFile;
  } catch (error) {
    toast.error("Erreur lors de la conversion HEIC", { id: toastId });
    console.error("HEIC conversion error:", error);
    throw new Error("Impossible de convertir l'image HEIC. Veuillez réessayer ou utiliser un autre format.");
  }
}

/**
 * Process a file before upload - converts HEIC to JPEG if needed
 * @param file - The file to process
 * @returns The original file or converted JPEG if it was HEIC
 */
export async function processFileForUpload(file: File): Promise<File> {
  if (isHeicFile(file)) {
    return convertHeicToJpeg(file);
  }
  return file;
}
