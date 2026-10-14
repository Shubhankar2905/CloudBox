import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";

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
    const upload = await prisma.multipartUpload.findFirst({
      where: { id: fileId, uploadId, userId },
    });
    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    if (upload.status === "completed") {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }
    if (upload.status !== "aborted") {
      await getS3Client().send(new AbortMultipartUploadCommand({
        Bucket: getS3Bucket(),
        Key: upload.storageKey,
        UploadId: upload.uploadId,
      }));
      await prisma.multipartUpload.update({
        where: { id: upload.id },
        data: { status: "aborted" },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Multipart upload abort failed:", error);
    return NextResponse.json({ error: "Failed to abort multipart upload" }, { status: 500 });
  }
}
