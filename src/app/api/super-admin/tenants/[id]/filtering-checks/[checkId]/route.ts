import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string; checkId: string }> };

/** Full detail of one Filtering & Monitoring check visit — SUPER_ADMIN only. */
export async function GET(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, checkId } = await params;

    const check = await prisma.filteringCheck.findUnique({
      where: { id: checkId },
      include: {
        performedBy: { select: { name: true, email: true } },
        devices: {
          orderBy: { order: "asc" },
          include: { results: { include: { item: true } } },
        },
      },
    });
    if (!check || check.tenantId !== tenantId) throw new AuthError("Filtering check not found", 404);

    return {
      id: check.id,
      performedAt: check.performedAt,
      performedByName: check.performedBy.name ?? check.performedBy.email,
      notes: check.notes,
      sentToDslAt: check.sentToDslAt,
      devices: check.devices.map((d) => ({
        id: d.id,
        label: d.label,
        results: [...d.results]
          .sort((a, b) => a.item.order - b.item.order)
          .map((r) => ({
            itemId: r.itemId,
            title: r.item.title,
            guidance: r.item.guidance,
            outcome: r.outcome,
            actionNotes: r.actionNotes,
          })),
      })),
    };
  });
}

/** Permanently deletes a logged Filtering & Monitoring check visit — SUPER_ADMIN only. */
export async function DELETE(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, checkId } = await params;

    const check = await prisma.filteringCheck.findUnique({ where: { id: checkId } });
    if (!check || check.tenantId !== tenantId) throw new AuthError("Filtering check not found", 404);

    await prisma.filteringCheck.delete({ where: { id: checkId } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "filtering_check.deleted",
        entityType: "FilteringCheck",
        entityId: checkId,
        metadata: { performedAt: check.performedAt.toISOString() },
      },
    });

    return { deleted: true };
  });
}
