import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get user's storage limit
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        storageLimit: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Calculate total storage used across all folders
    const aggregate = await prisma.file.aggregate({
      where: {
        userId: decoded.userId,
      },
      _sum: {
        size: true,
      },
    });

    const used = aggregate._sum.size ?? BigInt(0);
    const limit = user.storageLimit;

    const remaining =
      limit > used ? limit - used : BigInt(0);

    // BigInt values must be serialized as strings
    return NextResponse.json({
      storage: {
        used: used.toString(),
        limit: limit.toString(),
        remaining: remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching storage usage:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}