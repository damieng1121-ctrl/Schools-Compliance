import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FilteringCheckForm } from "@/components/filtering-check-form";

export default async function NewFilteringCheckPage({ params }: PageProps<"/dashboard/super-admin/[id]/filtering-checks/new">) {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const { id } = await params;

  return <FilteringCheckForm tenantId={id} />;
}
