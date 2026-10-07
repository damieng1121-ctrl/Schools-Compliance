import { requireTenantSession } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

/** Read-only list of this school's own Filtering & Monitoring check visits, most recent first — any tenant role. Logging/editing checks stays a SUPER_ADMIN-only action. */
export async function GET() {
  return withApiErrors(async () => {
    const session = await requireTenantSession();

    const checks = await prisma.filteringCheck.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { performedAt: "desc" },
      include: {
        performedBy: { select: { name: true, email: true } },
        devices: { include: { results: true } },
      },
    });

    return checks.map((c) => ({
      id: c.id,
      performedAt: c.performedAt,
      performedByName: c.performedBy.name ?? c.performedBy.email,
      notes: c.notes,
      sentToDslAt: c.sentToDslAt,
      deviceCount: c.devices.length,
      failCount: c.devices.flatMap((d) => d.results).filter((r) => r.outcome === "FAIL").length,
    }));
  });
}
