import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

import { getS3Bucket, getS3Client } from "@/lib/s3";
import { findShareForDownload } from "@/lib/share-download";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const link = await findShareForDownload(token);
    if (!link) {
      return NextResponse.json(
        { message: "Share link is invalid, expired, or revoked" },
        { status: 404 },
      );
    }
    if (!link.allowDownload) {
      return NextResponse.json(
        { message: "Downloads are disabled for this share link" },
        { status: 403 },
      );
    }

    const downloadUrl = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: link.file.storageKey,
        ResponseContentType: link.file.mimeType,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(link.file.name)}`,
      }),
      { expiresIn: 300 },
    );
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Download shared file error:", error);
    return NextResponse.json(
      { message: "Unable to prepare file download" },
      { status: 500 },
    );
  }
}
