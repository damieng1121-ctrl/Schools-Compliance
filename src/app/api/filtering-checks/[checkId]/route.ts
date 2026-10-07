import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ checkId: string }> };

/** Read-only detail of one of this school's own Filtering & Monitoring check visits — any tenant role. */
export async function GET(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    const { checkId } = await params;

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
    if (!check || check.tenantId !== session.user.tenantId) throw new AuthError("Filtering check not found", 404);

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
