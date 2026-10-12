
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB per file

export async function POST(req: NextRequest) {
  let storageKey: string | null = null;
  let s3Client: ReturnType<typeof getS3Client> | null = null;
  let bucket: string | null = null;

  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Verify user exists and retrieve their quota
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        storageLimit: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User does not exist" },
        { status: 401 }
      );
    }

    // 3. Read and validate incoming file
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Empty files are not allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "FILE_TOO_LARGE",
          message: "The maximum file size is 100 MB.",
        },
        { status: 413 }
      );
    }

    // 4. Validate destination folder ownership
    const folderIdValue = formData.get("folderId");
    const folderId =
      typeof folderIdValue === "string" && folderIdValue.trim()
        ? folderIdValue.trim()
        : null;

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: userId,
        },
        select: { id: true },
      });

      if (!folder) {
        return NextResponse.json(
          { success: false, error: "Folder not found" },
          { status: 404 }
        );
      }
    }

    // 5. Calculate current storage usage
    const aggregate = await prisma.file.aggregate({
      where: { userId },
      _sum: { size: true },
    });

    const usedStorage = aggregate._sum.size ?? BigInt(0);
    const incomingSize = BigInt(file.size);
    const storageLimit = user.storageLimit;

    // Reject if this upload would exceed the user's quota
    if (usedStorage + incomingSize > storageLimit) {
      const remaining =
        storageLimit > usedStorage
          ? storageLimit - usedStorage
          : BigInt(0);

      return NextResponse.json(
        {
          success: false,
          error: "STORAGE_LIMIT_EXCEEDED",
          message:
            "You don't have enough storage space. Delete some files or increase your storage limit.",
          used: usedStorage.toString(),
          limit: storageLimit.toString(),
          remaining: remaining.toString(),
          incomingSize: incomingSize.toString(),
        },
        { status: 413 }
      );
    }

    // 6. Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer());

    storageKey = `users/${userId}/${randomUUID()}`;
    s3Client = getS3Client();
    bucket = getS3Bucket();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        ContentLength: file.size,
      })
    );

    // 7. Save file metadata in PostgreSQL
    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        size: incomingSize,
        mimeType: file.type || "application/octet-stream",
        storageKey,
        userId,
        folderId,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        name: savedFile.name,
        size: savedFile.size.toString(),
        mimeType: savedFile.mimeType,
        storageKey: savedFile.storageKey,
        userId: savedFile.userId,
        folderId: savedFile.folderId,
        createdAt: savedFile.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up an S3 object if the database save failed.
    if (storageKey && s3Client && bucket) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: storageKey,
          })
        );
      } catch (cleanupError) {
        console.error("S3 cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
