import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlatformAdminsTable } from "@/components/platform-admins-table";

export default async function PlatformAdminsPage() {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Platform admins</h1>
      <p className="mt-1 text-sm text-slate-600">Everyone here can see and manage every school on the platform.</p>
      <div className="mt-6">
        <PlatformAdminsTable
          initialAdmins={admins.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
