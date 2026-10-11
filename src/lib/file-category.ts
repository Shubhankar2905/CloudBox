export type FileCategory = "all" | "media" | "docs" | "images" | "others";

const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tif", "tiff", "heic", "avif"];
const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv"];
const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"];
const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "txt", "rtf", "odt", "ods"];

function extensionOf(name: string) {
  const extension = name.trim().toLowerCase().split(".").pop();
  return extension && extension !== name.trim().toLowerCase() ? extension : "";
}

export function getFileCategory(name: string, mimeType?: string | null): Exclude<FileCategory, "all"> {
  const mime = (mimeType || "").toLowerCase();
  const extension = extensionOf(name);

  if (mime.startsWith("image/") || imageExtensions.includes(extension)) return "images";
  if (mime.startsWith("video/") || mime.startsWith("audio/") || videoExtensions.includes(extension) || audioExtensions.includes(extension)) {
    return "media";
  }
  if (
    mime === "application/pdf" ||
    mime.startsWith("text/") ||
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    documentExtensions.includes(extension)
  ) {
    return "docs";
  }
  return "others";
}
