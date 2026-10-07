import { z } from "zod";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string; itemId: string }> };

const bodySchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLIANT", "NON_COMPLIANT", "NOT_APPLICABLE"]),
  evidenceNotes: z.string().max(2000).optional(),
  evidenceUrl: z.string().url().optional().or(z.literal("")),
  nextReviewDue: z.string().optional(), // ISO date
  criteriaAnswers: z.record(z.string(), z.string()).optional(),
});

type CriterionDef = { id: string; levels: { value: string }[] };

/** Drops any answer that doesn't name one of this item's own criteria/levels, so stray input can't corrupt the stored JSON. */
function sanitizeCriteriaAnswers(
  answers: Record<string, string> | undefined,
  criteria: unknown,
): Record<string, string> | undefined {
  if (!answers) return undefined;
  const defs = Array.isArray(criteria) ? (criteria as CriterionDef[]) : [];
  const result: Record<string, string> = {};
  for (const def of defs) {
    const value = answers[def.id];
    if (value && def.levels.some((l) => l.value === value)) result[def.id] = value;
  }
  return result;
}

/** Lets a platform admin fill in or update a school's compliance answers on their behalf — SUPER_ADMIN only. */
export async function PUT(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, itemId } = await params;

    const [tenant, item, previous] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
      prisma.complianceItem.findUnique({ where: { id: itemId }, include: { standard: { select: { title: true } } } }),
      prisma.complianceAssessment.findUnique({ where: { tenantId_itemId: { tenantId, itemId } } }),
    ]);
    if (!tenant) throw new AuthError("School not found", 404);
    if (!item) throw new AuthError("Compliance item not found", 404);

    const body = bodySchema.parse(await req.json());
    const evidenceNotes = body.evidenceNotes || null;
    const evidenceUrl = body.evidenceUrl || null;
    const nextReviewDue = body.nextReviewDue ? new Date(body.nextReviewDue) : null;
    const criteriaAnswers = sanitizeCriteriaAnswers(body.criteriaAnswers, item.criteria);

    const assessment = await prisma.complianceAssessment.upsert({
      where: { tenantId_itemId: { tenantId, itemId } },
      create: {
        tenantId,
        itemId,
        status: body.status,
        evidenceNotes,
        evidenceUrl,
        nextReviewDue,
        ...(criteriaAnswers && { criteriaAnswers }),
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      update: {
        status: body.status,
        evidenceNotes,
        evidenceUrl,
        nextReviewDue,
        ...(criteriaAnswers && { criteriaAnswers }),
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    const changed =
      !previous ||
      previous.status !== body.status ||
      (previous.evidenceNotes ?? null) !== evidenceNotes ||
      (previous.evidenceUrl ?? null) !== evidenceUrl ||
      (previous.nextReviewDue?.toISOString() ?? null) !== (nextReviewDue?.toISOString() ?? null) ||
      (criteriaAnswers && JSON.stringify(previous?.criteriaAnswers ?? {}) !== JSON.stringify(criteriaAnswers));

    if (changed) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          action: "compliance.assessed_by_super_admin",
          entityType: "ComplianceItem",
          entityId: itemId,
          metadata: {
            standardTitle: item.standard.title,
            itemTitle: item.title,
            previousStatus: previous?.status ?? null,
            status: body.status,
            evidenceNotes,
            evidenceUrl,
            nextReviewDue: nextReviewDue?.toISOString() ?? null,
            ...(criteriaAnswers && { criteriaAnswers }),
          },
        },
      });
    }

    return assessment;
  });
}
