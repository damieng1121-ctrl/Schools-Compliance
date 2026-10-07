import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FilteringCheckDetailView } from "@/components/filtering-check-detail";

export default async function FilteringCheckDetailPage({
  params,
}: PageProps<"/dashboard/super-admin/[id]/filtering-checks/[checkId]">) {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const { id, checkId } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { name: true } });

  return (
    <FilteringCheckDetailView
      apiBase={`/api/super-admin/tenants/${id}`}
      checkId={checkId}
      backHref={`/dashboard/super-admin/${id}`}
      backLabel={tenant?.name ?? "Back"}
    />
  );
}
