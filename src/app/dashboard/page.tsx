import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenantSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardOverviewPage() {
  const rawSession = await auth();
  if (rawSession?.user.role === "SUPER_ADMIN") redirect("/dashboard/super-admin");

  const session = await requireTenantSession();

  const [standards, assessments] = await Promise.all([
    prisma.complianceStandard.findMany({ include: { items: true } }),
    prisma.complianceAssessment.findMany({ where: { tenantId: session.user.tenantId } }),
  ]);

  const assessmentByItem = new Map(assessments.map((a) => [a.itemId, a]));
  const allItems = standards.flatMap((s) => s.items);
  const compliant = allItems.filter((i) => assessmentByItem.get(i.id)?.status === "COMPLIANT").length;
  const nonCompliant = allItems.filter((i) => assessmentByItem.get(i.id)?.status === "NON_COMPLIANT").length;
  const notStarted = allItems.filter((i) => !assessmentByItem.has(i.id) || assessmentByItem.get(i.id)?.status === "NOT_STARTED").length;
  const overallPct = allItems.length ? Math.round((compliant / allItems.length) * 100) : 0;

  const upcomingReviews = assessments
    .filter((a) => a.nextReviewDue)
    .sort((a, b) => (a.nextReviewDue! < b.nextReviewDue! ? -1 : 1))
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-600">Your school&apos;s readiness against the DfE digital &amp; technology standards.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Overall readiness" value={`${overallPct}%`} />
        <Stat label="Standards met" value={`${compliant} / ${allItems.length}`} />
        <Stat label="Non-compliant" value={nonCompliant} highlight={nonCompliant > 0} />
        <Stat label="Not started" value={notStarted} />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Next steps</h2>
          <Link href="/dashboard/compliance" className="text-sm text-indigo-600 hover:underline">
            Go to checklist →
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Work through the checklist, tick off each item as you meet it, and email yourself a report to
          keep for your records.
        </p>
      </div>

      {upcomingReviews.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Upcoming reviews</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {upcomingReviews.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span className="text-slate-700">Review due</span>
                <span className="text-slate-900">{new Date(a.nextReviewDue!).toLocaleDateString("en-GB")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-700">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
