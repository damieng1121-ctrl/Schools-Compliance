import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Server-side session guard for API routes and server components. `tenantId` is null for SUPER_ADMIN, who belongs to no single school — use `requireTenantSession` for tenant-scoped routes. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new AuthError("Not authenticated", 401);
  return session as typeof session & { user: { id: string; role: Role; tenantId: string | null } };
}

/** Same as requireSession, but also requires the user belong to a tenant (i.e. not a platform SUPER_ADMIN). Always derive `tenantId` from here for tenant-scoped queries — never trust a client-supplied tenant id. */
export async function requireTenantSession() {
  const session = await requireSession();
  if (!session.user.tenantId) {
    throw new AuthError("This action requires a school (tenant) account", 403);
  }
  return session as typeof session & { user: { tenantId: string } };
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}
