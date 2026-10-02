import { requireTenantSession } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

const LOG_LIMIT = 300;

/** Recent compliance-assessment changes for this school, for the Logs tab — reviewable, printable, exportable. */
export async function GET() {
  return withApiErrors(async () => {
    const session = await requireTenantSession();

    const logs = await prisma.auditLog.findMany({
      where: { tenantId: session.user.tenantId, entityType: "ComplianceItem" },
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
