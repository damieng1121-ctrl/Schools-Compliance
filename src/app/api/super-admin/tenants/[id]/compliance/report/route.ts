import { z } from "zod";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";
import { buildComplianceReportEmail } from "@/lib/compliance-report-email";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  userIds: z.array(z.string()).optional(),
  extraEmails: z.array(z.string().trim().toLowerCase().email()).optional(),
});

/** Emails a school's DfE compliance report to selected users and/or extra addresses — defaults to the school's admin(s) if nothing is selected — SUPER_ADMIN only. */
export async function POST(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId } = await params;
    const raw = await req.text();
    const { userIds, extraEmails } = bodySchema.parse(raw ? JSON.parse(raw) : {});

    const [tenant, standards, assessments] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.complianceStandard.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.complianceAssessment.findMany({ where: { tenantId } }),
    ]);
    if (!tenant) throw new AuthError("School not found", 404);

    let recipientEmails: string[];
    if ((userIds && userIds.length) || (extraEmails && extraEmails.length)) {
      const selectedUsers = userIds?.length
        ? await prisma.user.findMany({
            where: { id: { in: userIds }, tenantId, isActive: true },
            select: { email: true },
          })
        : [];
      recipientEmails = [...new Set([...selectedUsers.map((u) => u.email), ...(extraEmails ?? [])])];
    } else {
      const admins = await prisma.user.findMany({ where: { tenantId, role: "ADMIN", isActive: true }, select: { email: true } });
      recipientEmails = admins.map((a) => a.email);
    }
    if (recipientEmails.length === 0) {
      throw new AuthError("This school has no admin user to send the report to yet — select a recipient", 400);
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

    const recipients = recipientEmails.join(", ");
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
