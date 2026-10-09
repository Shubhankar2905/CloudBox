import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Get token from cookie
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
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 3. Get data sent by frontend
    const { name, parentId } = await req.json();

    // 4. Validate folder name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { message: "Folder name is required" },
        { status: 400 }
      );
    }

    // 5. If creating inside another folder,
    //    make sure that parent folder belongs to the user
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          ownerId: userId,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { message: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    // 6. Create folder
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        parentId: parentId || null,
      },
    });

    // 7. Return created folder
    return NextResponse.json(
      {
        message: "Folder created successfully",
        folder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create folder error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {
    // Authenticate user
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
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get parentId from query string
    const { searchParams } = new URL(req.url); // this one is from the query string, not the body
    const parentId = searchParams.get("parentId");
    const includeAll = searchParams.get("all") === "true";

    // Get folders
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: userId,
        ...(includeAll ? {} : { parentId: parentId || null }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      folders,
    });
  } catch (error) {
    console.error("Get folders error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}