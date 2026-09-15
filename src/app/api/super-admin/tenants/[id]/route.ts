import { z } from "zod";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** Full detail for one school, including its users — SUPER_ADMIN only. */
export async function GET(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!tenant) throw new AuthError("School not found", 404);

    const [totalItems, compliantCount] = await Promise.all([
      prisma.complianceItem.count(),
      prisma.complianceAssessment.count({ where: { tenantId: id, status: "COMPLIANT" } }),
    ]);

    return { ...tenant, totalItems, compliantCount };
  });
}

const bodySchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(200).optional(),
  urn: z.string().trim().max(50).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

/** Edit a school's details and/or suspend/reactivate it — SUPER_ADMIN only. Suspended tenants keep their data but their users can no longer sign in. */
export async function PATCH(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());

    const wasActiveChange = "isActive" in body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.urn !== undefined && { urn: body.urn || null }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: wasActiveChange
          ? body.isActive
            ? "tenant.reactivated"
            : "tenant.suspended"
          : "tenant.updated_by_super_admin",
        entityType: "Tenant",
        entityId: tenant.id,
      },
    });

    return tenant;
  });
}
