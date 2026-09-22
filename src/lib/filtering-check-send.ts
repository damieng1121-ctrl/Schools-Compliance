import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";
import { buildFilteringCheckEmail } from "@/lib/filtering-check-email";
import { AuthError } from "@/lib/session";

/** Emails a completed Filtering & Monitoring check to the school's DSL, and marks it sent. */
export async function sendFilteringCheckToDsl(checkId: string, actorUserId: string) {
  const check = await prisma.filteringCheck.findUniqueOrThrow({
    where: { id: checkId },
    include: {
      tenant: true,
      performedBy: { select: { name: true, email: true } },
      devices: { orderBy: { order: "asc" }, include: { results: { include: { item: true } } } },
    },
  });

  if (!check.tenant.dslEmail) {
    throw new AuthError("This school doesn't have a DSL email set yet — add one in School details first.", 400);
  }

  const { subject, text, html } = buildFilteringCheckEmail({
    tenantName: check.tenant.name,
    dslName: check.tenant.dslName,
    timezone: check.tenant.timezone,
    performedAt: check.performedAt,
    performedByName: check.performedBy.name ?? check.performedBy.email,
    notes: check.notes,
    devices: check.devices.map((d) => ({
      label: d.label,
      results: [...d.results]
        .sort((a, b) => a.item.order - b.item.order)
        .map((r) => ({ title: r.item.title, outcome: r.outcome, actionNotes: r.actionNotes })),
    })),
  });

  const notifications = getNotificationProvider();
  await notifications.send({ to: check.tenant.dslEmail, subject, text, html });

  const updated = await prisma.filteringCheck.update({
    where: { id: checkId },
    data: { sentToDslAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: check.tenantId,
      userId: actorUserId,
      action: "filtering_check.sent_to_dsl",
      entityType: "FilteringCheck",
      entityId: checkId,
      metadata: { dslEmail: check.tenant.dslEmail },
    },
  });

  return updated;
}
