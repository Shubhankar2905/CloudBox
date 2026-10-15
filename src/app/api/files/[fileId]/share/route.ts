import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserId, verifyToken } from "@/lib/auth";
import {
  createShareToken,
  hashShareToken,
  isShareLinkActive,
} from "@/lib/share-links";

type RouteContext = { params: Promise<{ fileId: string }> };

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const decodeduserId = await getUserId();
    if(!decodeduserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fileId } = await params;
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: decodeduserId },
      select: { id: true },
    });

    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const allowDownload =
      body.allowDownload === undefined ? true : body.allowDownload;
    if (typeof allowDownload !== "boolean") {
      return NextResponse.json(
        { message: "allowDownload must be a boolean" },
        { status: 400 },
      );
    }

    let expiresAt: Date | null = null;
    if (body.expiresAt !== undefined && body.expiresAt !== null) {
      if (typeof body.expiresAt !== "string") {
        return NextResponse.json(
          { message: "expiresAt must be an ISO date or null" },
          { status: 400 },
        );
      }
      expiresAt = new Date(body.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        return NextResponse.json(
          { message: "expiresAt must be a future date" },
          { status: 400 },
        );
      }
    }

    const token = createShareToken();
    const link = await prisma.sharedLink.create({
      data: {
        tokenHash: hashShareToken(token),
        fileId: file.id,
        createdById: decodeduserId,
        allowDownload,
        expiresAt,
      },
      select: {
        id: true,
        allowDownload: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        share: {
          ...link,
          token,
          url: new URL(`/api/share/${token}`, req.url).toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create share link error:", error);
    return NextResponse.json(
      { message: "Unable to create share link" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const decodeduserId = await getUserId();
    if(!decodeduserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fileId } = await params;
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: decodeduserId },
      select: { id: true },
    });
    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const links = await prisma.sharedLink.findMany({
      where: { fileId, createdById: decodeduserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        allowDownload: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      shares: links.map((link) => ({
        ...link,
        active: isShareLinkActive(link),
      })),
    });
  } catch (error) {
    console.error("List share links error:", error);
    return NextResponse.json(
      { message: "Unable to list share links" },
      { status: 500 },
    );
  }
}
