import { z } from "zod";
import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";
import { buildComplianceReportEmail } from "@/lib/compliance-report-email";

const bodySchema = z.object({
  userIds: z.array(z.string()).optional(),
  extraEmails: z.array(z.string().trim().toLowerCase().email()).optional(),
});

/** Emails the current DfE compliance report to the selected team members and/or extra addresses — defaults to the requester's own address if nothing is selected. */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    const raw = await req.text();
    const { userIds, extraEmails } = bodySchema.parse(raw ? JSON.parse(raw) : {});

    let recipientEmails: string[];
    if ((userIds && userIds.length) || (extraEmails && extraEmails.length)) {
      const selectedUsers = userIds?.length
        ? await prisma.user.findMany({
            where: { id: { in: userIds }, tenantId: session.user.tenantId, isActive: true },
            select: { email: true },
          })
        : [];
      recipientEmails = [...new Set([...selectedUsers.map((u) => u.email), ...(extraEmails ?? [])])];
    } else {
      if (!session.user.email) throw new AuthError("Your account has no email address on file", 400);
      recipientEmails = [session.user.email];
    }
    if (recipientEmails.length === 0) throw new AuthError("Select at least one recipient", 400);
    const recipientEmail = recipientEmails.join(", ");

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
        metadata: { overallPct, compliantCount, totalItems: allItems.length, recipients: recipientEmails },
      },
    });

    return { sent: true, to: recipientEmail };
  });
}
