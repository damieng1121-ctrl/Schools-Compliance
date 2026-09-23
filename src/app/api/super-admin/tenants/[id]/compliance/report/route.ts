import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";
import { buildComplianceReportEmail } from "@/lib/compliance-report-email";

type Params = { params: Promise<{ id: string }> };

/** Emails a school's DfE compliance report to that school's admin(s) — SUPER_ADMIN only. */
export async function POST(_req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId } = await params;

    const [tenant, admins, standards, assessments] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.user.findMany({ where: { tenantId, role: "ADMIN", isActive: true }, select: { email: true } }),
      prisma.complianceStandard.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.complianceAssessment.findMany({ where: { tenantId } }),
    ]);
    if (!tenant) throw new AuthError("School not found", 404);
    if (admins.length === 0) {
      throw new AuthError("This school has no admin user to send the report to yet", 400);
    }

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

    const recipients = admins.map((a) => a.email).join(", ");
    const notifications = getNotificationProvider();
    await notifications.send({ to: recipients, subject, text, html });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "compliance.report_emailed_by_super_admin",
        entityType: "ComplianceStandard",
        metadata: { overallPct, compliantCount, totalItems: allItems.length, recipients },
      },
    });

    return { sent: true, to: recipients };
  });
}
