import type { Role } from "@prisma/client";

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}
