import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string; userId: string }> };

/**
 * Clears a user's 2FA enrollment — SUPER_ADMIN only. For account-recovery
 * use (e.g. a lost authenticator device): the user is forced back through
 * the setup flow on their next login.
 */
export async function PATCH(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, userId } = await params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new AuthError("User not found", 404);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "user.2fa_reset_by_super_admin",
        entityType: "User",
        entityId: userId,
        metadata: { email: user.email },
      },
    });

    return { reset: true };
  });
}

/** Removes a user from a school — SUPER_ADMIN only. Their compliance/audit history stays, just unattributed. */
export async function DELETE(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, userId } = await params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new AuthError("User not found", 404);

    await prisma.user.delete({ where: { id: userId } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "user.removed_by_super_admin",
        entityType: "User",
        entityId: userId,
        metadata: { email: user.email, name: user.name },
      },
    });

    return { deleted: true };
  });
}
