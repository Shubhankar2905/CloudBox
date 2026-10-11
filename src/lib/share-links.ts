import { createHash, randomBytes } from "node:crypto";

export function createShareToken() {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isShareLinkActive(link: {
  revokedAt: Date | null;
  expiresAt: Date | null;
}) {
  return !link.revokedAt && (!link.expiresAt || link.expiresAt > new Date());
}
