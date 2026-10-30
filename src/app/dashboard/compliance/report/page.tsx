"use client";

import { useEffect, useState } from "react";
import { ComplianceReportView } from "@/components/compliance-report-view";
import { SendReportDialog } from "@/components/send-report-dialog";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
type Assessment = {
  status: Status;
  technicianNotes: string | null;
  sltNotes: string | null;
  nextReviewDue: string | null;
  reviewedAt: string | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  govLink: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  audience: "TECHNICIAN" | "SLT" | "DSL";
  assessment: Assessment;
};
type Standard = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidence: { evidenceUrl: string | null };
  items: Item[];
};
type Tenant = { name: string; logoUrl: string | null };

export default function CompliancePrintReportPage() {
  const [standards, setStandards] = useState<Standard[] | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/compliance").then((r) => r.json()), fetch("/api/tenant").then((r) => r.json())]).then(
      ([s, t]) => {
        setStandards(s);
        setTenant(t);
      },
    );
  }, []);

  if (!standards || !tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <ComplianceReportView
      standards={standards}
      tenant={tenant}
      backHref="/dashboard/compliance"
      backLabel="Back to checklist"
      toolbar={
        <SendReportDialog
          endpoint="/api/compliance/report"
          fetchRecipients={() => fetch("/api/team").then((r) => r.json())}
        />
      }
    />
  );
}
