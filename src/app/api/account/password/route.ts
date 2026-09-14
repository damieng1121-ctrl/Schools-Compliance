import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireSession, AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function PUT(req: Request) {
  return withApiErrors(async () => {
    const session = await requireSession();
    const { currentPassword, newPassword } = bodySchema.parse(await req.json());

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AuthError("Current password is incorrect", 400);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { ok: true };
  });
}
