"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CheckRow = {
  id: string;
  performedAt: string;
  performedByName: string;
  sentToDslAt: string | null;
  deviceCount: number;
  failCount: number;
};

export function FilteringChecksList({ tenantId, hasDslEmail }: { tenantId: string; hasDslEmail: boolean }) {
  const [checks, setChecks] = useState<CheckRow[] | null>(null);

  useEffect(() => {
    fetch(`/api/super-admin/tenants/${tenantId}/filtering-checks`)
      .then((r) => r.json())
      .then(setChecks);
  }, [tenantId]);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Filtering &amp; Monitoring checks</h2>
        </div>
        <Link href={`/dashboard/super-admin/${tenantId}/filtering-checks/new`}>
          <Button size="sm">
            <PlusCircle size={14} />
            Log a check
          </Button>
        </Link>
      </div>
      {!hasDslEmail && (
        <p className="border-b border-slate-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-800">
          No DSL email set for this school yet — reports can be logged but not emailed until one&apos;s added above.
        </p>
      )}
      <div className="divide-y divide-slate-100">
        {checks === null && <p className="px-5 py-4 text-sm text-slate-500">Loading…</p>}
        {checks?.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No checks logged yet.</p>}
        {checks?.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/super-admin/${tenantId}/filtering-checks/${c.id}`}
            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {new Date(c.performedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                <span className="font-normal text-slate-500"> &middot; {c.performedByName}</span>
              </p>
              <p className="text-xs text-slate-500">
                {c.deviceCount} device{c.deviceCount === 1 ? "" : "s"} tested
              </p>
            </div>
            {c.failCount > 0 && (
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                {c.failCount} failed
              </span>
            )}
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                c.sentToDslAt ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {c.sentToDslAt ? "Sent to DSL" : "Not sent"}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
