import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {

    //get Cookie
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    //verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    // This is the REAL user ID from PostgreSQL
    const userId = decoded.userId;

    console.log("Authenticated user ID:", userId);


    // Check if the user exists in the database
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User does not exist",
        },
        { status: 401 }
      );
    }


    // Handle file upload
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }


    // Convert the file to a buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);


    //
    const cloudinaryResult = await new Promise<any>(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "google-drive-clone",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

        uploadStream.end(buffer);
      }
    );

    // Save file metadata to the database
    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        size: BigInt(file.size),
        mimeType: file.type,

        cloudinaryId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,

        // REAL authenticated user's ID
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,

      file: {
        id: savedFile.id,
        name: savedFile.name,
        size: savedFile.size.toString(),
        mimeType: savedFile.mimeType,
        cloudinaryId: savedFile.cloudinaryId,
        cloudinaryUrl: savedFile.cloudinaryUrl,
        userId: savedFile.userId,
        createdAt: savedFile.createdAt,
      },
    });

  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
      },
      { status: 500 }
    );
  }
}