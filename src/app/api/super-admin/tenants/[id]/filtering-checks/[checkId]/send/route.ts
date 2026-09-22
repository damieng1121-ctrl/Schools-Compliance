import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendFilteringCheckToDsl } from "@/lib/filtering-check-send";

type Params = { params: Promise<{ id: string; checkId: string }> };

/** (Re)sends a Filtering & Monitoring check report to the school's DSL — SUPER_ADMIN only. */
export async function POST(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId, checkId } = await params;

    const check = await prisma.filteringCheck.findUnique({ where: { id: checkId }, select: { tenantId: true } });
    if (!check || check.tenantId !== tenantId) throw new AuthError("Filtering check not found", 404);

    const updated = await sendFilteringCheckToDsl(checkId, session.user.id);
    return { sentToDslAt: updated.sentToDslAt };
  });
}
