import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jsonFormat = req.nextUrl.searchParams.get("format") === "json";
    const file = await prisma.file.findFirst({
      where: { id, userId: decoded.userId },
    });
    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const previewUrl = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: file.storageKey,
        ResponseContentType: file.mimeType,
        ResponseContentDisposition: "inline",
      }),
      { expiresIn: 300 },
    );

    if (jsonFormat) {
      return NextResponse.json({
        url: previewUrl,
        name: file.name,
        mimeType: file.mimeType,
      });
    }

    return NextResponse.redirect(previewUrl);
  } catch (error) {
    console.error("Preview file error:", error);
    return NextResponse.json(
      { message: "Unable to prepare file preview" },
      { status: 500 },
    );
  }
}
