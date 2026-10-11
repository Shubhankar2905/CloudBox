import { prisma } from "@/lib/prisma";
import { hashShareToken, isShareLinkActive } from "@/lib/share-links";

export async function findShareForDownload(token: string) {
  const link = await prisma.sharedLink.findUnique({
    where: { tokenHash: hashShareToken(token) },
    select: {
      allowDownload: true,
      revokedAt: true,
      expiresAt: true,
      file: {
        select: { name: true, storageKey: true, mimeType: true },
      },
    },
  });
  return link && isShareLinkActive(link) ? link : null;
}
