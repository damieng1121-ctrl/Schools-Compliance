import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SuperAdminTenantsTable } from "@/components/super-admin-tenants-table";

export default async function SuperAdminPage() {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") redirect("/dashboard");

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

  const rows = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    userCount: t._count.users,
    compliantCount: compliantCountByTenant.get(t.id) ?? 0,
    totalItems,
  }));

  const activeCount = rows.filter((r) => r.isActive).length;
  const avgReadiness = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + (r.totalItems ? r.compliantCount / r.totalItems : 0), 0) / rows.length * 100)
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">All schools</h1>
      <p className="mt-1 text-sm text-slate-600">Every school on the platform, across all tenants.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total schools" value={rows.length} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Suspended" value={rows.length - activeCount} highlight={rows.length - activeCount > 0} />
        <Stat label="Avg. readiness" value={`${avgReadiness}%`} />
      </div>

      <div className="mt-6">
        <SuperAdminTenantsTable initialTenants={rows} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-700">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
