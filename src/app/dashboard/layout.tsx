import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const tenant = session.user.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, logoUrl: true },
      })
    : null;

  return (
    <div className="flex min-h-screen flex-1 bg-[#f7f7f8] print:block print:bg-white">
      <div className="border-r border-slate-200/80 print:hidden">
        <DashboardNav
          tenantName={isSuperAdmin ? "Platform admin" : (tenant?.name ?? "Your school")}
          tenantLogoUrl={tenant?.logoUrl}
          userName={session.user.name ?? session.user.email ?? "Account"}
          isAdmin={session.user.role === "ADMIN"}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
      <main className="flex-1 overflow-x-hidden p-8 print:p-0">
        <div className="mx-auto max-w-6xl animate-fade-in print:max-w-none">{children}</div>
      </main>
    </div>
  );
}
