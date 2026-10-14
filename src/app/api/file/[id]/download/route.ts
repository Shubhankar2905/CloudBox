import { GetObjectCommand } from "@aws-sdk/client-s3";
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

    const range = req.headers.get("range") || undefined;
    const result = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: file.storageKey,
        Range: range,
      }),
    );

    if (!result.Body) {
      return NextResponse.json({ message: "File content is unavailable" }, { status: 404 });
    }

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    });
    if (result.ContentLength !== undefined) {
      headers.set("Content-Length", String(result.ContentLength));
    }
    if (result.ContentRange) headers.set("Content-Range", result.ContentRange);

    return new NextResponse(result.Body.transformToWebStream(), {
      status: range ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Download file error:", error);
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 416) {
      return NextResponse.json({ message: "Requested download range is invalid" }, { status: 416 });
    }

    return NextResponse.json(
      { message: "Unable to prepare file download" },
      { status: 500 }
    );
  }
}