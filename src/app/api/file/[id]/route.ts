import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getUserId, verifyToken } from "@/lib/auth";
import { getS3Bucket, getS3Client } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const decodeduserId = await getUserId();
    if(!decodeduserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params; // id is the file ID from the URL

    // 4. Find file belonging to this user
    const file = await prisma.file.findFirst({
      where: {
        id: id,
        userId: decodeduserId,
      },
    });

    // 5. File doesn't exist OR doesn't belong to user
    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    // 6. Return file
const serializedFile = {
  ...file,
  size: file.size.toString(),
};

return NextResponse.json(
  { file: serializedFile },
  { status: 200 }
);

  } catch (error) {
    console.error("GET /api/files/[id] error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Get token
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 3. Get file ID from URL
    const { id } = await params;

    // 4. Check that this file belongs to the logged-in user
    const file = await prisma.file.findFirst({
      where: {
        id,
        userId: decoded.userId,
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    // 5. Get data from request
    const body = await req.json();
    const folderId =
      body.folderId === null || body.folderId === undefined
        ? null
        : typeof body.folderId === "string" && body.folderId.trim()
          ? body.folderId.trim()
          : undefined;

    if (folderId !== undefined) {
      const destination = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: decoded.userId,
        },
      });

      if (!destination) {
        return NextResponse.json(
          { message: "Destination folder not found" },
          { status: 404 }
        );
      }
    }

    // 6. Update only allowed fields
    const updatedFile = await prisma.file.update({
      where: {
        id,
      },
      data: {
        ...(typeof body.name === "string" ? { name: body.name } : {}),
        ...(folderId !== undefined ? { folderId } : {}),
      },
    });

    // 7. Return updated file
    return NextResponse.json(
      {
        file: {
          ...updatedFile,
          size: updatedFile.size.toString(),
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("PATCH /api/files/[id] error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Get token
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 3. Get file ID
    const { id } = await params;

    // 4. Check ownership
    const file = await prisma.file.findFirst({
      where: {
        id,
        userId: decoded.userId,
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    // 5. Delete the object from S3
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getS3Bucket(),
        Key: file.storageKey,
      })
    );

    // 6. Delete metadata from PostgreSQL
    await prisma.file.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE /api/files/[id] error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}