"use client";

import { use, useEffect, useState } from "react";
import { ComplianceReportView } from "@/components/compliance-report-view";
import { SendReportDialog } from "@/components/send-report-dialog";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
type Assessment = {
  status: Status;
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  govLink: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  assessment: Assessment;
};
type Standard = { id: string; code: string; title: string; description: string; items: Item[] };
type Tenant = { name: string; logoUrl: string | null };

export default function SuperAdminComplianceReportPage({ params }: PageProps<"/dashboard/super-admin/[id]/compliance/report">) {
  const { id: tenantId } = use(params);
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/super-admin/tenants/${tenantId}/compliance`).then((r) => r.json()),
      fetch(`/api/super-admin/tenants/${tenantId}`).then((r) => r.json()),
    ]).then(([s, t]) => {
      setStandards(s);
      setTenant(t);
    });
  }, [tenantId]);

  if (!standards || !tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <ComplianceReportView
      standards={standards}
      tenant={tenant}
      backHref={`/dashboard/super-admin/${tenantId}`}
      backLabel={tenant.name || "Back"}
      toolbar={
        <SendReportDialog
          endpoint={`/api/super-admin/tenants/${tenantId}/compliance/report`}
          fetchRecipients={() =>
            fetch(`/api/super-admin/tenants/${tenantId}`)
              .then((r) => r.json())
              .then((t) => t.users ?? [])
          }
        />
      }
    />
  );
}
