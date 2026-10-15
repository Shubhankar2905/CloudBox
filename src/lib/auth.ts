import jwt from "jsonwebtoken";
import { cookies } from "next/headers";              

const JWT_SECRET = process.env.JWT_SECRET!;

export function createToken(userId: string) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };
  } catch {
    return null;
  }
}



export async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  return decoded.userId;
}