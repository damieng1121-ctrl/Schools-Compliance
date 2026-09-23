import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireTenantSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";
import { buildWelcomeEmail } from "@/lib/welcome-email";

export async function GET() {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    return prisma.user.findMany({
      where: { tenantId: session.user.tenantId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  });
}

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

/** Admin-only: invites a colleague by creating their account with a random temporary password, emailed to them. */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const session = await requireTenantSession();
    if (session.user.role !== "ADMIN") throw new AuthError("Only admins can add team members", 403);

    const { name, email, role } = bodySchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AuthError("An account with that email already exists", 409);

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: { tenantId: session.user.tenantId, name, email, role, passwordHash },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
    const notifications = getNotificationProvider();
    const { subject, text, html } = buildWelcomeEmail({
      subject: `You've been added to ${tenant.name}'s compliance dashboard`,
      recipientName: name,
      intro: `You've been added as a${role === "ADMIN" ? "n" : ""} ${role === "ADMIN" ? "admin" : "team member"} on ${tenant.name}'s Schools Compliance dashboard.`,
      email,
      tempPassword,
      appUrl: process.env.NEXTAUTH_URL,
    });
    await notifications.send({ to: email, subject, text, html });

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "user.invited",
        entityType: "User",
        entityId: user.id,
        metadata: { email, role },
      },
    });

    return user;
  });
}
