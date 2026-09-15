import { z } from "zod";
import { requireRole } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  isActive: z.boolean(),
});

/** Suspend/reactivate a school — SUPER_ADMIN only. Suspended tenants keep their data but their users can no longer sign in. */
export async function PATCH(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id } = await params;
    const { isActive } = bodySchema.parse(await req.json());

    const tenant = await prisma.tenant.update({ where: { id }, data: { isActive } });

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: isActive ? "tenant.reactivated" : "tenant.suspended",
        entityType: "Tenant",
        entityId: tenant.id,
      },
    });

    return tenant;
  });
}
