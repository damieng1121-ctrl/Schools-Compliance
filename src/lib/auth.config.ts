import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma access — bcrypt/DB calls need a
 * Node.js runtime). This is what middleware.ts uses to gate routes; the
 * full config with the credentials provider lives in src/lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Pure token -> session.user field mapping, no DB access — safe to share
    // between the edge (middleware, via this config) and the full Node
    // config in auth.ts.
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
      if (isDashboardRoute) return isLoggedIn;
      return true;
    },
  },
  providers: [], // populated in auth.ts (kept out of the edge bundle)
} satisfies NextAuthConfig;
