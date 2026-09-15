import { z } from "zod";
import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

/** Returns the signed-in user's own school (any tenant member can view). */
export async function GET() {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    return prisma.tenant.findUniqueOrThrow({
      where: { id: session.user.tenantId },
      select: { id: true, name: true, logoUrl: true },
    });
  });
}

const bodySchema = z.object({
  name: z.string().trim().min(2).max(200),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

/** Admin-only: updates the signed-in user's own school (name, logo). */
export async function PATCH(req: Request) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    if (session.user.role !== "ADMIN") throw new AuthError("Only admins can update school settings", 403);

    const { name, logoUrl } = bodySchema.parse(await req.json());

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { name, logoUrl: logoUrl || null },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: "tenant.updated",
        entityType: "Tenant",
        entityId: tenant.id,
      },
    });

    return tenant;
  });
}
