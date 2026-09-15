import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireRole, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { getNotificationProvider } from "@/lib/notifications";

/** Platform-wide view across every school — SUPER_ADMIN only. */
export async function GET() {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);

    const [tenants, totalItems, compliantByTenant] = await Promise.all([
      prisma.tenant.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.complianceItem.count(),
      prisma.complianceAssessment.groupBy({
        by: ["tenantId"],
        where: { status: "COMPLIANT" },
        _count: { _all: true },
      }),
    ]);

    const compliantCountByTenant = new Map(compliantByTenant.map((c) => [c.tenantId, c._count._all]));

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isActive: t.isActive,
      createdAt: t.createdAt,
      userCount: t._count.users,
      compliantCount: compliantCountByTenant.get(t.id) ?? 0,
      totalItems,
    }));
  });
}

const bodySchema = z.object({
  schoolName: z.string().trim().min(2).max(200),
  adminName: z.string().trim().min(1).max(200),
  adminEmail: z.string().trim().toLowerCase().email(),
});

/** Creates a new school and its first ADMIN, emailing them a temporary password — SUPER_ADMIN only. */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const session = await requireRole(["SUPER_ADMIN"]);
    const { schoolName, adminName, adminEmail } = bodySchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) throw new AuthError("An account with that email already exists", 409);

    const baseSlug = slugify(schoolName);
    let slug = baseSlug;
    for (let i = 1; await prisma.tenant.findUnique({ where: { slug } }); i++) {
      slug = `${baseSlug}-${i}`;
    }

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name: schoolName,
        slug,
        users: {
          create: { email: adminEmail, name: adminName, passwordHash, role: "ADMIN" },
        },
      },
      include: { _count: { select: { users: true } } },
    });

    const notifications = getNotificationProvider();
    await notifications.send({
      to: adminEmail,
      subject: `Your school's compliance dashboard is ready`,
      text: `Hi ${adminName},\n\n${schoolName} has been set up on Schools Compliance, with you as the admin.\n\nSign in at ${process.env.NEXTAUTH_URL ?? "http://localhost:3004"}/login with:\n  Email: ${adminEmail}\n  Temporary password: ${tempPassword}\n\nYou'll be able to change your password once signed in.`,
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: "tenant.created_by_super_admin",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: { schoolName, adminEmail },
      },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      userCount: tenant._count.users,
      compliantCount: 0,
      totalItems: await prisma.complianceItem.count(),
    };
  });
}
