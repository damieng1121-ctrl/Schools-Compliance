import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SchoolManage } from "@/components/school-manage";

export default async function ManageSchoolPage({ params }: PageProps<"/dashboard/super-admin/[id]">) {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const { id } = await params;

  return <SchoolManage tenantId={id} />;
}
