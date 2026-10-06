import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { verifyTotpCode, generateBackupCodes } from "@/lib/totp";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
  code: z.string().trim().min(6).max(6),
});

/**
 * Confirms the first TOTP code against the pending secret from
 * /api/auth/2fa/status, then flips twoFactorEnabled on and issues one-time
 * backup/recovery codes (shown to the user exactly once here). The actual
 * session is still established afterwards via next-auth's own signIn(),
 * which re-verifies the same code now that twoFactorEnabled is true.
 */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const { email, password, code } = bodySchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    if (!user || !user.isActive) throw new AuthError("Incorrect email or password");
    if (user.tenant && !user.tenant.isActive) throw new AuthError("Incorrect email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AuthError("Incorrect email or password");

    if (user.twoFactorEnabled) throw new AuthError("2FA is already set up for this account", 409);
    if (!user.twoFactorSecret) throw new AuthError("Start setup again — no pending 2FA secret found", 400);

    if (!verifyTotpCode(user.twoFactorSecret, code)) {
      throw new AuthError("That code didn't match — check the time on your phone and try again", 400);
    }

    const { plain, hashed } = await generateBackupCodes();

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorBackupCodes: hashed },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "user.2fa_enabled",
        entityType: "User",
        entityId: user.id,
      },
    });

    return { backupCodes: plain };
  });
}
