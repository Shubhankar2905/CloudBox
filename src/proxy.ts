import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";

export default function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const isDashboardRequest = req.nextUrl.pathname.startsWith("/dashboard");

  if (!token) {
    if (isDashboardRequest) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    return NextResponse.json(
      { error: "Unauthorized. Please login." },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    if (isDashboardRequest) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/file/:path*",
    "/api/folder/:path*",
    "/api/me/:path*",
    "/api/upload/:path*",
    "/dashboard/:path*",

  ],
};