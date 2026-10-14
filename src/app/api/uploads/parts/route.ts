import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const partNumber = body.partNumber;
    if (!fileId || !uploadId || !Number.isInteger(partNumber)) {
      return NextResponse.json({ error: "Invalid part request" }, { status: 400 });
    }

    const upload = await prisma.multipartUpload.findFirst({
      where: { id: fileId, uploadId, userId },
    });
    if (!upload || upload.status !== "initiated") {
      return NextResponse.json({ error: "Upload not found or no longer active" }, { status: 404 });
    }

    const totalParts = Math.ceil(Number(upload.fileSize) / upload.partSize);
    if (partNumber < 1 || partNumber > totalParts || partNumber > 10_000) {
      return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
    }

    const url = await getSignedUrl(
      getS3Client(),
      new UploadPartCommand({
        Bucket: getS3Bucket(),
        Key: upload.storageKey,
        UploadId: upload.uploadId,
        PartNumber: partNumber,
      }),
      { expiresIn: 900 },
    );
    return NextResponse.json({ url, partNumber });
  } catch (error) {
    console.error("Multipart part URL generation failed:", error);
    return NextResponse.json({ error: "Failed to generate part URL" }, { status: 500 });
  }
}
