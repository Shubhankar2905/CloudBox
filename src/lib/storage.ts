import { prisma } from "@/lib/prisma";

export async function getStorageUsage(userId: string) {
  const [user, aggregate] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true },
    }),

    prisma.file.aggregate({
      where: { userId },
      _sum: { size: true },
    }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const used = aggregate._sum.size ?? BigInt(0);

  return {
    used,
    limit: user.storageLimit,
    remaining:
      user.storageLimit > used ? user.storageLimit - used : BigInt(0),
  };
}