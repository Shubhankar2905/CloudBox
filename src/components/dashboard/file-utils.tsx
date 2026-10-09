import {
  Archive,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  LucideIcon,
} from "lucide-react";

export function formatFileSize(value: string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = -1;
  do {
    size /= 1024;
    unitIndex += 1;
  } while (size >= 1024 && unitIndex < units.length - 1);
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatModifiedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function getFileType(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "Archive";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet")
  ) {
    return "Document";
  }
  return "File";
}

export function getFileIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return Archive;
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("spreadsheet") ||
    mimeType.startsWith("text/")
  ) {
    return FileText;
  }
  return File;
}

export { Folder };
