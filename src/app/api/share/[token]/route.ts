import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashShareToken, isShareLinkActive } from "@/lib/share-links";

type RouteContext = { params: Promise<{ token: string }> };

async function findActiveShare(token: string) {
  const link = await prisma.sharedLink.findUnique({
    where: { tokenHash: hashShareToken(token) },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return link && isShareLinkActive(link) ? link : null;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ message: "Share link not found" }, { status: 404 });
    }

    const link = await findActiveShare(token);
    if (!link) {
      return NextResponse.json(
        { message: "Share link is invalid, expired, or revoked" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      share: {
        file: { ...link.file, size: link.file.size.toString() },
        allowDownload: link.allowDownload,
        expiresAt: link.expiresAt,
      },
    });
  } catch (error) {
    console.error("Validate share link error:", error);
    return NextResponse.json(
      { message: "Unable to validate share link" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const decoded = verifyToken(req.cookies.get("token")?.value || "");
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const link = await prisma.sharedLink.findUnique({
      where: { tokenHash: hashShareToken(token) },
      select: { id: true, createdById: true, revokedAt: true },
    });
    if (!link || link.createdById !== decoded.userId) {
      return NextResponse.json({ message: "Share link not found" }, { status: 404 });
    }
    if (link.revokedAt) {
      return NextResponse.json({ message: "Share link is already revoked" }, { status: 409 });
    }

    await prisma.sharedLink.update({
      where: { id: link.id },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ message: "Share link revoked successfully" });
  } catch (error) {
    console.error("Revoke share link error:", error);
    return NextResponse.json(
      { message: "Unable to revoke share link" },
      { status: 500 },
    );
  }
}
