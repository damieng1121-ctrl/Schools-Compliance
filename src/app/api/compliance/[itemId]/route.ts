import { z } from "zod";
import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ itemId: string }> };

const bodySchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLIANT", "NON_COMPLIANT", "NOT_APPLICABLE"]),
  evidenceNotes: z.string().max(2000).optional(),
  evidenceUrl: z.string().url().optional().or(z.literal("")),
  nextReviewDue: z.string().optional(), // ISO date
});

export async function PUT(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    const { itemId } = await params;
    const [item, previous] = await Promise.all([
      prisma.complianceItem.findUnique({ where: { id: itemId }, include: { standard: { select: { title: true } } } }),
      prisma.complianceAssessment.findUnique({ where: { tenantId_itemId: { tenantId: session.user.tenantId, itemId } } }),
    ]);
    if (!item) throw new AuthError("Compliance item not found", 404);

    const body = bodySchema.parse(await req.json());
    const evidenceNotes = body.evidenceNotes || null;
    const evidenceUrl = body.evidenceUrl || null;
    const nextReviewDue = body.nextReviewDue ? new Date(body.nextReviewDue) : null;

    const assessment = await prisma.complianceAssessment.upsert({
      where: { tenantId_itemId: { tenantId: session.user.tenantId, itemId } },
      create: {
        tenantId: session.user.tenantId,
        itemId,
        status: body.status,
        evidenceNotes,
        evidenceUrl,
        nextReviewDue,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      update: {
        status: body.status,
        evidenceNotes,
        evidenceUrl,
        nextReviewDue,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Only log when something actually changed, so re-saving an untouched
    // form (e.g. the idle-timeout autosave) doesn't spam the log.
    const changed =
      !previous ||
      previous.status !== body.status ||
      (previous.evidenceNotes ?? null) !== evidenceNotes ||
      (previous.evidenceUrl ?? null) !== evidenceUrl ||
      (previous.nextReviewDue?.toISOString() ?? null) !== (nextReviewDue?.toISOString() ?? null);

    if (changed) {
      await prisma.auditLog.create({
        data: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
          action: "compliance.assessed",
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
          },
        },
      });
    }

    return assessment;
  });
}
