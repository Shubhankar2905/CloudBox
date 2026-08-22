import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }


    const { id } = await params; // id is the file ID from the URL

    // 4. Find file belonging to this user
    const file = await prisma.file.findFirst({
      where: {
        id: id,
        userId: decoded.userId,
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

    // 6. Update only allowed fields
    const updatedFile = await prisma.file.update({
      where: {
        id,
      },
      data: {
        name: body.name,
      },
    });

    // 7. Return updated file
    return NextResponse.json(
      { file: updatedFile },
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

    // 5. Delete actual file from Cloudinary
    await cloudinary.uploader.destroy(file.cloudinaryId, {
      resource_type: "auto",
    });

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