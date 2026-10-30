import { z } from "zod";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string; standardId: string }> };

const bodySchema = z.object({
  evidenceUrl: z.string().url().optional().or(z.literal("")),
});

/** Lets a platform admin set a school's one evidence link for a whole standard — SUPER_ADMIN only. */
export async function PUT(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, standardId } = await params;

    const [tenant, standard] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
      prisma.complianceStandard.findUnique({ where: { id: standardId }, select: { id: true } }),
    ]);
    if (!tenant) throw new AuthError("School not found", 404);
    if (!standard) throw new AuthError("Standard not found", 404);

    const { evidenceUrl } = bodySchema.parse(await req.json());

    const evidence = await prisma.standardEvidence.upsert({
      where: { tenantId_standardId: { tenantId, standardId } },
      create: { tenantId, standardId, evidenceUrl: evidenceUrl || null, updatedById: session.user.id },
      update: { evidenceUrl: evidenceUrl || null, updatedById: session.user.id },
    });

    return evidence;
  });
}
