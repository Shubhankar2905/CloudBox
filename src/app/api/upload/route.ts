import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Check user exists
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User does not exist",
        },
        { status: 401 }
      );
    }

    // Read multipart/form-data
    const formData = await req.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

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
      });

      if (!folder) {
        return NextResponse.json(
          {
            success: false,
            error: "Folder not found",
          },
          { status: 404 }
        );
      }
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storageKey = `users/${userId}/${randomUUID()}`;
    const s3Client = getS3Client();
    const bucket = getS3Bucket();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        ContentLength: file.size,
      })
    );

    try {
      const savedFile = await prisma.file.create({
        data: {
          name: file.name,
          size: BigInt(file.size),
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
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: storageKey,
        })
      );

      throw error;
    }
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
      },
      { status: 500 }
    );
  }
}