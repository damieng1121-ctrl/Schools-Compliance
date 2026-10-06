import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { generateSecret, generateQrDataUrl, verifyTotpCode, generateBackupCodes } from "@/lib/totp";

async function checkPassword(userId: string, currentPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AuthError("Current password is incorrect", 400);
}

const startSchema = z.object({ currentPassword: z.string().min(1) });

/**
 * Self-service 2FA re-enrollment, e.g. moving to a new phone — confirms the
 * current password, then returns a fresh (unsaved) secret/QR. Nothing is
 * persisted until PUT confirms a code against it, so an abandoned attempt
 * never risks the account's existing, working 2FA.
 */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const session = await requireSession();
    const { currentPassword } = startSchema.parse(await req.json());
    await checkPassword(session.user.id, currentPassword);

    const secret = generateSecret();
    return { qrDataUrl: await generateQrDataUrl(session.user.email ?? "", secret), secret };
  });
}

const confirmSchema = z.object({
  currentPassword: z.string().min(1),
  secret: z.string().min(1),
  code: z.string().trim().min(6).max(6),
});

/** Confirms a code against the secret from POST, then saves it and issues fresh backup codes (old ones are invalidated). */
export async function PUT(req: Request) {
  return withApiErrors(async () => {
    const session = await requireSession();
    const { currentPassword, secret, code } = confirmSchema.parse(await req.json());
    await checkPassword(session.user.id, currentPassword);

    if (!verifyTotpCode(secret, code)) {
      throw new AuthError("That code didn't match — check the time on your phone and try again", 400);
    }

    const { plain, hashed } = await generateBackupCodes();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: true, twoFactorBackupCodes: hashed },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "user.2fa_reenrolled",
        entityType: "User",
        entityId: session.user.id,
      },
    });

    return { backupCodes: plain };
  });
}
