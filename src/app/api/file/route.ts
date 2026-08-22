import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    // return NextResponse.json(
    //   { message: "Token is valid" },
    //   { status: 200 }
    // );
    const files = await prisma.file.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

const serializedFiles = files.map((file) => ({
  ...file,
  size: file.size.toString(),
}));

return NextResponse.json({
  files: serializedFiles,
});
  } catch (error) {
    console.error("Error fetching files:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}