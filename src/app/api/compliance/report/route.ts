import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";
import { buildComplianceReportEmail } from "@/lib/compliance-report-email";

/** Emails the current DfE compliance report to the requesting user's own address. */
export async function POST() {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    const recipientEmail = session.user.email;
    if (!recipientEmail) throw new AuthError("Your account has no email address on file", 400);

    const [tenant, standards, assessments] = await Promise.all([
      prisma.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } }),
      prisma.complianceStandard.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.complianceAssessment.findMany({ where: { tenantId: session.user.tenantId } }),
    ]);

    const assessmentByItem = new Map(assessments.map((a) => [a.itemId, a]));
    const allItems = standards.flatMap((s) => s.items);
    const compliantCount = allItems.filter((i) => assessmentByItem.get(i.id)?.status === "COMPLIANT").length;
    const overallPct = allItems.length ? Math.round((compliantCount / allItems.length) * 100) : 0;

    const { subject, text, html } = buildComplianceReportEmail({
      tenantName: tenant.name,
      timezone: tenant.timezone,
      standards,
      assessmentByItem,
      appUrl: process.env.NEXTAUTH_URL,
    });

    const notifications = getNotificationProvider();
    await notifications.send({ to: recipientEmail, subject, text, html });

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "compliance.report_emailed",
        entityType: "ComplianceStandard",
        metadata: { overallPct, compliantCount, totalItems: allItems.length },
      },
    });

    return { sent: true, to: recipientEmail };
  });
}
