import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";
import { generateSecret, generateQrDataUrl } from "@/lib/totp";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
});

/**
 * Pre-session step in the credentials login flow: validates email/password
 * (without issuing a session — that still only happens via next-auth's own
 * signIn) and tells the client whether to show "enter your code" or
 * "scan this QR to set up 2FA". A pending secret is persisted as soon as
 * setup begins so the same QR is shown across retries, but `twoFactorEnabled`
 * stays false until confirm-setup verifies a code.
 */
export async function POST(req: Request) {
  return withApiErrors(async () => {
    const { email, password } = bodySchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    if (!user || !user.isActive) throw new AuthError("Incorrect email or password");
    if (user.tenant && !user.tenant.isActive) throw new AuthError("Incorrect email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AuthError("Incorrect email or password");

    if (user.twoFactorEnabled) {
      return { stage: "code" as const };
    }

    const secret = user.twoFactorSecret ?? generateSecret();
    if (!user.twoFactorSecret) {
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
    }

    return {
      stage: "setup" as const,
      qrDataUrl: await generateQrDataUrl(user.email, secret),
      secret,
    };
  });
}
