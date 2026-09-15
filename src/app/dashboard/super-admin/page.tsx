import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SuperAdminTenantsTable } from "@/components/super-admin-tenants-table";
import { StatCard } from "@/components/ui/stat-card";
import { Building2, CheckCircle2, XCircle, Gauge } from "lucide-react";

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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">All schools</h1>
      <p className="mt-1 text-sm text-slate-500">Every school on the platform, across all tenants.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total schools" value={rows.length} icon={Building2} />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} tone="good" />
        <StatCard label="Suspended" value={rows.length - activeCount} icon={XCircle} tone={rows.length - activeCount > 0 ? "bad" : "neutral"} />
        <StatCard label="Avg. readiness" value={`${avgReadiness}%`} icon={Gauge} tone="brand" />
      </div>

      <div className="mt-6">
        <SuperAdminTenantsTable initialTenants={rows} />
      </div>
    </div>
  );
}
