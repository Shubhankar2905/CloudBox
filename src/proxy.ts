import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export default function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  console.log("TOKEN:", token);

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized. Please login." },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/test"],
};