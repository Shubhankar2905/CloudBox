import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
       const decodeduserId = await getUserId();
       if(!decodeduserId) {
         return NextResponse.json(
           { message: "Unauthorized" },
           { status: 401 }
         );
       }
    //this one is part of the url params, not the query string. 
    const { id } = await params;

    // Find folder belonging to current user
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        ownerId: decodeduserId,
      },
      include: {
        children: true,
        files: true,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { message: "Folder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      folder: {
        ...folder,
        files: folder.files.map((file) => ({
          ...file,
          size: file.size.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Get folder error:", error);

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
    // Authenticate user
    const decodeduserId = await getUserId();
    if(!decodeduserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get request body
    const { name } = await req.json();

    // Validate name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { message: "Folder name is required" },
        { status: 400 }
      );
    }

    // Check ownership
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        ownerId: decodeduserId,
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
        { message: "Folder not found" },
        { status: 404 }
      );
    }

    // Update folder
    const folder = await prisma.folder.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({
      message: "Folder updated successfully",
      folder,
    });
  } catch (error) {
    console.error("Update folder error:", error);

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
    // Authenticate user
    const decodeduserId = await getUserId();
    if(!decodeduserId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodeduserId;

    const { id } = await params;

    // Find folder and its contents
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        children: true,
        files: true,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { message: "Folder not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting non-empty folder
    if (folder.children.length > 0 || folder.files.length > 0) {
      return NextResponse.json(
        {
          message:
            "Folder is not empty. Delete its contents first.",
        },
        { status: 400 }
      );
    }

    // Delete folder
    await prisma.folder.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Delete folder error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}