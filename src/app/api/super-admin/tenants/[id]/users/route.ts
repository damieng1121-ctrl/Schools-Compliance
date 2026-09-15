import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

/** Adds a user to any school, emailing them a temporary password — SUPER_ADMIN only. */
export async function POST(req: Request, { params }: Params) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: tenantId } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new AuthError("School not found", 404);

    const { name, email, role } = bodySchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AuthError("An account with that email already exists", 409);

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: { tenantId, name, email, role, passwordHash },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    const notifications = getNotificationProvider();
    await notifications.send({
      to: email,
      subject: `You've been added to ${tenant.name}'s compliance dashboard`,
      text: `Hi ${name},\n\nYou've been added as a ${role === "ADMIN" ? "admin" : "team member"} on ${tenant.name}'s Schools Compliance dashboard.\n\nSign in at ${process.env.NEXTAUTH_URL ?? "http://localhost:3004"}/login with:\n  Email: ${email}\n  Temporary password: ${tempPassword}\n\nYou'll be able to change your password once signed in.`,
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "user.invited_by_super_admin",
        entityType: "User",
        entityId: user.id,
        metadata: { email, role },
      },
    });

    return user;
  });
}
