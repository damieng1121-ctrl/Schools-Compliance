import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Server-side session guard for API routes and server components. Always derive `tenantId` from here — never trust a client-supplied tenant id for scoping a query. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new AuthError("Not authenticated", 401);
  return session as typeof session & { user: { id: string; role: Role; tenantId: string } };
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}
