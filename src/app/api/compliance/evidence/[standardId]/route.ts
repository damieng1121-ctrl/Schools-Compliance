import { z } from "zod";
import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ standardId: string }> };

const bodySchema = z.object({
  evidenceUrl: z.string().url().optional().or(z.literal("")),
});

/** Sets this tenant's one evidence link (e.g. a Google Drive folder) for a whole standard, replacing a per-item Evidence URL field. */
export async function PUT(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    const { standardId } = await params;

    const standard = await prisma.complianceStandard.findUnique({ where: { id: standardId }, select: { id: true } });
    if (!standard) throw new AuthError("Standard not found", 404);

    const { evidenceUrl } = bodySchema.parse(await req.json());

    const evidence = await prisma.standardEvidence.upsert({
      where: { tenantId_standardId: { tenantId: session.user.tenantId, standardId } },
      create: { tenantId: session.user.tenantId, standardId, evidenceUrl: evidenceUrl || null, updatedById: session.user.id },
      update: { evidenceUrl: evidenceUrl || null, updatedById: session.user.id },
    });

    return evidence;
  });
}
