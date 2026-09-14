import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen flex-1">
      <DashboardNav
        tenantName={tenant?.name ?? "Your school"}
        userName={session.user.name ?? session.user.email ?? "Account"}
        isAdmin={session.user.role === "ADMIN"}
      />
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}
