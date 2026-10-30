import { requireTenantSession } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

/**
 * Returns the full DfE digital & technology standards catalogue, each item
 * annotated with this tenant's current assessment (or a NOT_STARTED
 * default if one doesn't exist yet), and each standard annotated with this
 * tenant's one evidence link for that standard, if set.
 */
export async function GET() {
  return withApiErrors(async () => {
    const session = await requireTenantSession();

    const [standards, assessments, evidence] = await Promise.all([
      prisma.complianceStandard.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.complianceAssessment.findMany({ where: { tenantId: session.user.tenantId } }),
      prisma.standardEvidence.findMany({ where: { tenantId: session.user.tenantId } }),
    ]);

    const assessmentByItem = new Map(assessments.map((a) => [a.itemId, a]));
    const evidenceByStandard = new Map(evidence.map((e) => [e.standardId, e]));

    return standards.map((standard) => ({
      ...standard,
      evidence: evidenceByStandard.get(standard.id) ?? { evidenceUrl: null, updatedAt: null },
      items: standard.items.map((item) => ({
        ...item,
        assessment: assessmentByItem.get(item.id) ?? {
          status: "NOT_STARTED" as const,
          technicianNotes: null,
          sltNotes: null,
          nextReviewDue: null,
          reviewedAt: null,
          criteriaAnswers: null,
        },
      })),
    }));
  });
}
