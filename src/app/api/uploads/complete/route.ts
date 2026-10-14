import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CompleteMultipartUploadCommand,
  CompletedPart,
} from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get("token")?.value;
    const userId = token ? verifyToken(token)?.userId : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const fileId = typeof body.fileId === "string" ? body.fileId : "";
    const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
    const rawParts = Array.isArray(body.parts) ? body.parts : [];
    const upload = await prisma.multipartUpload.findFirst({
      where: { id: fileId, uploadId, userId },
    });
    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    if (upload.status === "completed" && upload.completedFileId) {
      const file = await prisma.file.findUnique({ where: { id: upload.completedFileId } });
      return NextResponse.json({
        success: true,
        file: file ? { ...file, size: file.size.toString() } : null,
      });
    }
    if (upload.status !== "initiated") {
      return NextResponse.json({ error: "Upload is not active" }, { status: 409 });
    }

    const totalParts = Math.ceil(Number(upload.fileSize) / upload.partSize);
    const parts: CompletedPart[] = [];
    for (const part of rawParts) {
      if (
        typeof part !== "object" ||
        part === null ||
        !Number.isInteger((part as { PartNumber?: unknown }).PartNumber) ||
        typeof (part as { ETag?: unknown }).ETag !== "string"
      ) {
        return NextResponse.json({ error: "Invalid uploaded part" }, { status: 400 });
      }
      const partNumber = (part as { PartNumber: number }).PartNumber;
      const etag = (part as { ETag: string }).ETag.trim();
      if (partNumber < 1 || partNumber > totalParts || !/^"[^"]{1,200}"$/.test(etag)) {
        return NextResponse.json({ error: "Invalid uploaded part" }, { status: 400 });
      }
      parts.push({ PartNumber: partNumber, ETag: etag });
    }
    parts.sort((a, b) => (a.PartNumber || 0) - (b.PartNumber || 0));
    if (
      parts.length !== totalParts ||
      parts.some((part, index) => part.PartNumber !== index + 1)
    ) {
      return NextResponse.json({ error: "All parts must be uploaded in order" }, { status: 400 });
    }

    await getS3Client().send(new CompleteMultipartUploadCommand({
      Bucket: getS3Bucket(),
      Key: upload.storageKey,
      UploadId: upload.uploadId,
      MultipartUpload: { Parts: parts },
    }));

    const file = await prisma.$transaction(async (transaction) => {
      const current = await transaction.multipartUpload.findFirst({
        where: { id: upload.id, userId, status: "initiated" },
      });
      if (!current) {
        const completed = await transaction.multipartUpload.findUnique({ where: { id: upload.id } });
        if (completed?.completedFileId) {
          return transaction.file.findUnique({ where: { id: completed.completedFileId } });
        }
        throw new Error("Upload state changed during completion");
      }
      const created = await transaction.file.create({
        data: {
          name: current.fileName,
          size: current.fileSize,
          mimeType: current.mimeType,
          storageKey: current.storageKey,
          userId,
          folderId: current.folderId,
        },
      });
      await transaction.multipartUpload.update({
        where: { id: current.id },
        data: { status: "completed", completedFileId: created.id },
      });
      return created;
    });
    if (!file) {
      throw new Error("Completed file record was not found");
    }
    return NextResponse.json({
      success: true,
      file: { ...file, size: file?.size.toString() },
    });
  } catch (error) {
    console.error("Multipart upload completion failed:", error);
    return NextResponse.json({ error: "Failed to complete multipart upload" }, { status: 500 });
  }
}
