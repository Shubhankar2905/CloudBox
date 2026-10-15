import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import type { FileCategory } from "@/lib/file-category";

export async function GET(req: NextRequest) {
  try {

    const decodeduserId = await getUserId();
    if(!decodeduserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = new URL(req.url).searchParams;
    const folderId = searchParams.get("folderId");
    const requestedCategory = searchParams.get("category") || "all";
    const categories: FileCategory[] = ["all", "media", "docs", "images", "others"];
    const category = categories.includes(requestedCategory as FileCategory)
      ? (requestedCategory as FileCategory)
      : "all";

    const categoryFilters = {
      images: {
        OR: [
          { mimeType: { startsWith: "image/" } },
          { name: { endsWith: ".jpg", mode: "insensitive" as const } },
          { name: { endsWith: ".jpeg", mode: "insensitive" as const } },
          { name: { endsWith: ".png", mode: "insensitive" as const } },
          { name: { endsWith: ".gif", mode: "insensitive" as const } },
          { name: { endsWith: ".webp", mode: "insensitive" as const } },
          { name: { endsWith: ".svg", mode: "insensitive" as const } },
          { name: { endsWith: ".bmp", mode: "insensitive" as const } },
          { name: { endsWith: ".tif", mode: "insensitive" as const } },
          { name: { endsWith: ".tiff", mode: "insensitive" as const } },
          { name: { endsWith: ".heic", mode: "insensitive" as const } },
          { name: { endsWith: ".avif", mode: "insensitive" as const } },
        ],
      },
      media: {
        OR: [
          { mimeType: { startsWith: "video/" } },
          { mimeType: { startsWith: "audio/" } },
          ...["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv", "mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"]
            .map((extension) => ({ name: { endsWith: `.${extension}`, mode: "insensitive" as const } })),
        ],
      },
      docs: {
        OR: [
          { mimeType: "application/pdf" },
          { mimeType: { startsWith: "text/" } },
          { mimeType: { contains: "word" } },
          { mimeType: { contains: "document" } },
          { mimeType: { contains: "spreadsheet" } },
          { mimeType: { contains: "presentation" } },
          ...["pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "txt", "rtf", "odt", "ods"]
            .map((extension) => ({ name: { endsWith: `.${extension}`, mode: "insensitive" as const } })),
        ],
      },
    };

    const files = await prisma.file.findMany({
      where: {
        userId: decodeduserId,
        ...(category === "all"
          ? { folderId: folderId || null }
          : category === "others"
            ? { NOT: [categoryFilters.images, categoryFilters.media, categoryFilters.docs] }
            : categoryFilters[category]),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

const serializedFiles = files.map((file) => ({
  ...file,
  size: file.size.toString(),
}));

return NextResponse.json({
  files: serializedFiles,
});
  } catch (error) {
    console.error("Error fetching files:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}