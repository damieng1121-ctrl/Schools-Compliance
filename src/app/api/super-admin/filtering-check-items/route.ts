import { requireRole } from "@/lib/session";
import { withApiErrors } from "@/lib/api";
import { prisma } from "@/lib/db";

/** The fixed Filtering & Monitoring check catalogue (same 7 checks for every device tested) — SUPER_ADMIN only. */
export async function GET() {
  return withApiErrors(async () => {
    await requireRole(["SUPER_ADMIN"]);
    return prisma.filteringCheckItem.findMany({ orderBy: { order: "asc" } });
  });
}
