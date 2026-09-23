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
});

/** Lets a platform admin fill in or update a school's compliance answers on their behalf — SUPER_ADMIN only. */
export async function PUT(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, itemId } = await params;

    const [tenant, item] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
      prisma.complianceItem.findUnique({ where: { id: itemId } }),
    ]);
    if (!tenant) throw new AuthError("School not found", 404);
    if (!item) throw new AuthError("Compliance item not found", 404);

    const body = bodySchema.parse(await req.json());

    const assessment = await prisma.complianceAssessment.upsert({
      where: { tenantId_itemId: { tenantId, itemId } },
      create: {
        tenantId,
        itemId,
        status: body.status,
        evidenceNotes: body.evidenceNotes || null,
        evidenceUrl: body.evidenceUrl || null,
        nextReviewDue: body.nextReviewDue ? new Date(body.nextReviewDue) : null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      update: {
        status: body.status,
        evidenceNotes: body.evidenceNotes || null,
        evidenceUrl: body.evidenceUrl || null,
        nextReviewDue: body.nextReviewDue ? new Date(body.nextReviewDue) : null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "compliance.assessed_by_super_admin",
        entityType: "ComplianceItem",
        entityId: itemId,
        metadata: { status: body.status },
      },
    });

    return assessment;
  });
}
