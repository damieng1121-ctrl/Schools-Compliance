import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };
const LOG_LIMIT = 300;

/** Recent compliance-assessment changes for one school, for the Logs tab — SUPER_ADMIN only. */
export async function GET(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new AuthError("School not found", 404);

    const logs = await prisma.auditLog.findMany({
      where: { tenantId, entityType: "ComplianceItem" },
      orderBy: { createdAt: "desc" },
      take: LOG_LIMIT,
      include: { user: { select: { name: true, email: true } } },
    });

    return logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      action: log.action,
      userName: log.user?.name ?? log.user?.email ?? "Unknown user",
      metadata: log.metadata,
    }));
  });
}
