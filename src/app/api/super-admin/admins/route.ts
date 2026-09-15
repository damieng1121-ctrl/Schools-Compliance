import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getNotificationProvider } from "@/lib/notifications";

/** Lists every platform super admin — SUPER_ADMIN only. */
export async function GET() {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    return prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, name: true, email: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  });
}

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
});

/** Adds another platform super admin, emailing them a temporary password — SUPER_ADMIN only. No public signup path leads here. */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { name, email } = bodySchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AuthError("An account with that email already exists", 409);

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const admin = await prisma.user.create({
      data: { tenantId: null, name, email, role: "SUPER_ADMIN", passwordHash },
      select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    });

    const notifications = getNotificationProvider();
    await notifications.send({
      to: email,
      subject: `You've been added as a Schools Compliance platform admin`,
      text: `Hi ${name},\n\nYou've been given platform admin access on Schools Compliance — you can see and manage every school.\n\nSign in at ${process.env.NEXTAUTH_URL ?? "http://localhost:3004"}/login with:\n  Email: ${email}\n  Temporary password: ${tempPassword}\n\nYou'll be able to change your password once signed in.`,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "super_admin.invited",
        entityType: "User",
        entityId: admin.id,
        metadata: { email },
      },
    });

    return admin;
  });
}
