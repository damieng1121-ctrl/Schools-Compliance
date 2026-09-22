import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FilteringCheckDetailView } from "@/components/filtering-check-detail";

export default async function FilteringCheckDetailPage({
  params,
}: PageProps<"/dashboard/super-admin/[id]/filtering-checks/[checkId]">) {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const { id, checkId } = await params;

  return <FilteringCheckDetailView tenantId={id} checkId={checkId} />;
}
