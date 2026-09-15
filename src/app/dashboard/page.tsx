import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, CircleDashed, ArrowRight, CalendarClock } from "lucide-react";
import { requireTenantSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { ReadinessRing } from "@/components/ui/readiness-ring";

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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">Your school&apos;s readiness against the DfE digital &amp; technology standards.</p>

      <Card className="mt-6 flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
        <ReadinessRing pct={overallPct} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-slate-500">Overall readiness</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {compliant} of {allItems.length} standards met
          </p>
          <Link
            href="/dashboard/compliance"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:text-slate-700"
          >
            Go to checklist
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
          <MiniStat icon={CheckCircle2} label="Met" value={compliant} tone="text-emerald-600" />
          <MiniStat icon={XCircle} label="Non-compliant" value={nonCompliant} tone="text-red-600" />
          <MiniStat icon={CircleDashed} label="Not started" value={notStarted} tone="text-slate-400" />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Keep it up to date</h2>
          <p className="mt-2 text-sm text-slate-500">
            Work through the checklist, tick off each item as you meet it, and email yourself a report to
            keep for your records.
          </p>
          <Link
            href="/dashboard/compliance"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:text-slate-700"
          >
            Open the checklist
            <ArrowRight size={15} />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <CalendarClock size={17} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">Upcoming reviews</h2>
          </div>
          {upcomingReviews.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {upcomingReviews.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Review due</span>
                  <span className="font-medium text-slate-900">
                    {new Date(a.nextReviewDue!).toLocaleDateString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Nothing scheduled yet — set review dates on the checklist.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-3 py-3 text-center">
      <Icon size={16} className={tone} />
      <span className="text-lg font-bold text-slate-900">{value}</span>
      <span className="text-[11px] leading-tight text-slate-500">{label}</span>
    </div>
  );
}
