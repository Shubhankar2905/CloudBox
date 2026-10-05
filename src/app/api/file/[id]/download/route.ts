import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const file = await prisma.file.findFirst({
      where: {
        id,
        userId: decoded.userId,
      },
    });

    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const downloadUrl = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: file.storageKey,
        ResponseContentType: file.mimeType,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      }),
      { expiresIn: 300 }
    );

    return NextResponse.json({
      url: downloadUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Download file error:", error);

    return NextResponse.json(
      { message: "Unable to prepare file download" },
      { status: 500 }
    );
  }
}