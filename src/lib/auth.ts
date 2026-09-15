import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";
import { prisma } from "./db";

function allowedGoogleDomains(): string[] {
  return (process.env.GOOGLE_SSO_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
        if (!user || !user.isActive) return null;
        // A suspended school's users can't sign in, even with a correct password.
        if (user.tenant && !user.tenant.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    // Only enabled when AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET are set — see
    // DEPLOY.md. No account auto-provisioning: Google sign-in only ever
    // works for a User row an admin already created (via /signup or the
    // Team page), and only for allow-listed email domains — see signIn().
    ...(process.env.AUTH_GOOGLE_ID
      ? [Google({ authorization: { params: { prompt: "select_account" } } })]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true; // credentials already validated in authorize()
      if (!user.email) return false;

      const domain = user.email.split("@")[1]?.toLowerCase();
      if (!domain || !allowedGoogleDomains().includes(domain)) return false;

      const existing = await prisma.user.findUnique({ where: { email: user.email }, include: { tenant: true } });
      if (!existing || !existing.isActive) return false;
      if (existing.tenant && !existing.tenant.isActive) return false;

      return true;
    },
    async jwt({ token, user }) {
      // Only present on a fresh sign-in. Looked up by email (not user.id) —
      // for Google sign-ins, `user.id` is Google's own subject id, not our
      // internal cuid, since there's no adapter linking the two. Re-reads
      // role/tenantId from the DB so a role change or deactivation takes
      // effect on next login rather than being frozen into a stale token.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId;
        }
      }
      return token;
    },
  },
});
