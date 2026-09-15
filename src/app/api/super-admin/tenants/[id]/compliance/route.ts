import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** Read-only view of one school's full compliance self-assessment (every standard/item plus their answers) — SUPER_ADMIN only. */
export async function GET(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id }, select: { id: true } });
    if (!tenant) throw new AuthError("School not found", 404);

    const [standards, assessments] = await Promise.all([
      prisma.complianceStandard.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.complianceAssessment.findMany({
        where: { tenantId: id },
        include: { reviewedBy: { select: { name: true, email: true } } },
      }),
    ]);

    const assessmentByItem = new Map(assessments.map((a) => [a.itemId, a]));

    return standards.map((standard) => ({
      ...standard,
      items: standard.items.map((item) => {
        const a = assessmentByItem.get(item.id);
        return {
          ...item,
          assessment: {
            status: a?.status ?? ("NOT_STARTED" as const),
            evidenceNotes: a?.evidenceNotes ?? null,
            evidenceUrl: a?.evidenceUrl ?? null,
            nextReviewDue: a?.nextReviewDue ?? null,
            reviewedAt: a?.reviewedAt ?? null,
            reviewedByName: a?.reviewedBy?.name ?? a?.reviewedBy?.email ?? null,
          },
        };
      }),
    }));
  });
}
