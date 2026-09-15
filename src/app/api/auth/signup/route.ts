import { z } from "zod";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

const bodySchema = z.object({
  schoolName: z.string().trim().min(2).max(200),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

/** Self-service signup: creates a new tenant (school) and its first ADMIN user in one step. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all fields correctly." }, { status: 400 });
  }
  const { schoolName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const baseSlug = slugify(schoolName);
  let slug = baseSlug;
  for (let i = 1; await prisma.tenant.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: schoolName,
      slug,
      users: {
        create: { email, name, passwordHash, role: "ADMIN" },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      action: "tenant.created",
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { schoolName },
    },
  });

  return NextResponse.json({ ok: true });
}
