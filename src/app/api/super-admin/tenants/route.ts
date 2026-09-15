import { requireRole } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

/** Platform-wide view across every school — SUPER_ADMIN only. */
export async function GET() {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);

    const [tenants, totalItems, compliantByTenant] = await Promise.all([
      prisma.tenant.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.complianceItem.count(),
      prisma.complianceAssessment.groupBy({
        by: ["tenantId"],
        where: { status: "COMPLIANT" },
        _count: { _all: true },
      }),
    ]);

    const compliantCountByTenant = new Map(compliantByTenant.map((c) => [c.tenantId, c._count._all]));

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isActive: t.isActive,
      createdAt: t.createdAt,
      userCount: t._count.users,
      compliantCount: compliantCountByTenant.get(t.id) ?? 0,
      totalItems,
    }));
  });
}
