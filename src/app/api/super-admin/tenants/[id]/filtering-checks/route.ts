import { z } from "zod";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendFilteringCheckToDsl } from "@/lib/filtering-check-send";

type Params = { params: Promise<{ id: string }> };

/** List Filtering & Monitoring check visits for one school, most recent first — SUPER_ADMIN only. */
export async function GET(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId } = await params;

    const checks = await prisma.filteringCheck.findMany({
      where: { tenantId },
      orderBy: { performedAt: "desc" },
      include: {
        performedBy: { select: { name: true, email: true } },
        devices: { include: { results: true } },
      },
    });

    return checks.map((c) => ({
      id: c.id,
      performedAt: c.performedAt,
      performedByName: c.performedBy.name ?? c.performedBy.email,
      notes: c.notes,
      sentToDslAt: c.sentToDslAt,
      deviceCount: c.devices.length,
      failCount: c.devices.flatMap((d) => d.results).filter((r) => r.outcome === "FAIL").length,
    }));
  });
}

const resultSchema = z.object({
  itemId: z.string(),
  outcome: z.enum(["PASS", "FAIL", "NOT_APPLICABLE", "NOT_TESTED"]),
  actionNotes: z.string().max(2000).optional(),
});
const deviceSchema = z.object({
  label: z.string().trim().min(1).max(200),
  results: z.array(resultSchema).min(1),
});
const bodySchema = z.object({
  notes: z.string().max(2000).optional(),
  devices: z.array(deviceSchema).min(1),
  sendToDsl: z.boolean().optional(),
});

/** Records a Filtering & Monitoring check visit against a school, optionally emailing it to the DSL immediately — SUPER_ADMIN only. */
export async function POST(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new AuthError("School not found", 404);

    const body = bodySchema.parse(await req.json());

    const itemIds = new Set(body.devices.flatMap((d) => d.results.map((r) => r.itemId)));
    const validItemCount = await prisma.filteringCheckItem.count({ where: { id: { in: [...itemIds] } } });
    if (validItemCount !== itemIds.size) throw new AuthError("One or more check items were not recognised", 400);

    const check = await prisma.filteringCheck.create({
      data: {
        tenantId,
        performedById: session.user.id,
        notes: body.notes || null,
        devices: {
          create: body.devices.map((d, order) => ({
            label: d.label,
            order,
            results: {
              create: d.results.map((r) => ({
                itemId: r.itemId,
                outcome: r.outcome,
                actionNotes: r.actionNotes || null,
              })),
            },
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "filtering_check.created",
        entityType: "FilteringCheck",
        entityId: check.id,
        metadata: { deviceCount: body.devices.length },
      },
    });

    if (body.sendToDsl) {
      await sendFilteringCheckToDsl(check.id, session.user.id);
    }

    return { id: check.id };
  });
}
