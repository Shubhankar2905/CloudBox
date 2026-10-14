import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import {
  AbortMultipartUploadCommand,
  CreateMultipartUploadCommand,
} from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

const DEFAULT_PART_SIZE = 10 * 1024 * 1024;
const MIN_PART_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
const MAX_PARTS = 10_000;

function getPartSize(fileSize: number) {
  const configured = Number(process.env.S3_MULTIPART_PART_SIZE);
  const requested = Number.isSafeInteger(configured) && configured > 0
    ? configured
    : DEFAULT_PART_SIZE;
  return Math.max(MIN_PART_SIZE, requested, Math.ceil(fileSize / MAX_PARTS));
}

async function authenticateUser() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

async function findOrCreateFolderPath(
  userId: string,
  parentId: string | null,
  relativePath: string,
) {
  let currentParentId = parentId;
  const segments = relativePath
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => Boolean(segment) && segment !== "." && segment !== "..")
    .slice(0, 50);

  for (const name of segments) {
    let folder = await prisma.folder.findFirst({
      where: { ownerId: userId, parentId: currentParentId, name },
      select: { id: true },
    });
    if (!folder) {
      folder = await prisma.folder.create({
        data: { name, ownerId: userId, parentId: currentParentId },
        select: { id: true },
      });
    }
    currentParentId = folder.id;
  }
  return currentParentId;
}

export async function POST(request: NextRequest) {
  let storageKey: string | null = null;
  let uploadId: string | null = null;
  try {
    const userId = await authenticateUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const fileSize = body.fileSize;
    const mimeType = typeof body.mimeType === "string"
      ? body.mimeType.trim()
      : "application/octet-stream";
    const folderId = body.folderId === null || body.folderId === undefined
      ? null
      : typeof body.folderId === "string" && body.folderId.trim()
        ? body.folderId.trim()
        : undefined;
    const relativePath = typeof body.relativePath === "string" ? body.relativePath : "";

    if (
      !fileName ||
      fileName.length > 255 ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 100 * 1024 * 1024 ||
      fileSize > MAX_FILE_SIZE ||
      mimeType.length > 255 ||
      folderId === undefined ||
      relativePath.length > 4096
    ) {
      return NextResponse.json({ error: "Invalid file details" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, storageLimit: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, ownerId: userId },
        select: { id: true },
      });
      if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const aggregate = await prisma.file.aggregate({
      where: { userId },
      _sum: { size: true },
    });
    if ((aggregate._sum.size ?? BigInt(0)) + BigInt(fileSize) > user.storageLimit) {
      return NextResponse.json({
        error: "STORAGE_LIMIT_EXCEEDED",
        message: "You don't have enough storage space.",
      }, { status: 413 });
    }

    let destinationFolderId = folderId;
    if (relativePath) {
      const pathSegments = relativePath
        .replace(/\\/g, "/")
        .split("/")
        .map((segment: string) => segment.trim())
        .filter((segment: string) => Boolean(segment) && segment !== "." && segment !== "..");
      const directoryPath = pathSegments.slice(0, -1).join("/");
      if (directoryPath) {
        destinationFolderId = await findOrCreateFolderPath(
          userId,
          folderId,
          directoryPath,
        );
      }
    }

    const partSize = getPartSize(fileSize);
    const totalParts = Math.ceil(fileSize / partSize);
    if (totalParts > MAX_PARTS) {
      return NextResponse.json({ error: "Too many upload parts" }, { status: 400 });
    }

    storageKey = `users/${userId}/${randomUUID()}`;
    const result = await getS3Client().send(new CreateMultipartUploadCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
      ContentType: mimeType || "application/octet-stream",
      Metadata: { originalfilename: encodeURIComponent(fileName), ownerid: userId },
    }));
    if (!result.UploadId) throw new Error("S3 did not return an upload ID");
    uploadId = result.UploadId;

    const upload = await prisma.multipartUpload.create({
      data: {
        userId,
        fileName,
        fileSize: BigInt(fileSize),
        mimeType: mimeType || "application/octet-stream",
        storageKey,
        uploadId: result.UploadId,
        partSize,
        folderId: destinationFolderId,
      },
    });

    return NextResponse.json({
      fileId: upload.id,
      uploadId: upload.uploadId,
      storageKey,
      partSize,
      totalParts,
    }, { status: 201 });
  } catch (error) {
    console.error("Multipart upload initiation failed:", error);
    if (storageKey && uploadId) {
      try {
        await getS3Client().send(new AbortMultipartUploadCommand({
          Bucket: getS3Bucket(),
          Key: storageKey,
          UploadId: uploadId,
        }));
      } catch (cleanupError) {
        console.error("Failed to clean up multipart initiation:", cleanupError);
      }
    }
    return NextResponse.json({ error: "Failed to initiate multipart upload" }, { status: 500 });
  }
}
