import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/**
 * Clears a colleague's 2FA enrollment — ADMIN only, own tenant. For
 * account-recovery use (e.g. a lost authenticator device): they're forced
 * back through the setup flow on their next login.
 */
export async function PATCH(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    if (session.user.role !== "ADMIN") throw new AuthError("Only admins can reset a colleague's 2FA", 403);
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== session.user.tenantId) throw new AuthError("User not found", 404);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "user.2fa_reset",
        entityType: "User",
        entityId: userId,
        metadata: { email: user.email },
      },
    });

    return { reset: true };
  });
}
