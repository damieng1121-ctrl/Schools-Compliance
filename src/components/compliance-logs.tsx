"use client";

import { useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComplianceBadge } from "@/components/badges";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";

type LogMetadata = {
  standardTitle?: string;
  itemTitle?: string;
  previousStatus?: Status | null;
  status?: Status;
  evidenceNotes?: string | null;
  evidenceUrl?: string | null;
  nextReviewDue?: string | null;
};

type LogEntry = {
  id: string;
  createdAt: string;
  action: string;
  userName: string;
  metadata: LogMetadata | null;
};

const STATUS_LABELS: Record<Status, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-compliant",
  NOT_APPLICABLE: "Not applicable",
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(logs: LogEntry[]): string {
  const header = ["Date", "User", "Standard", "Item", "Previous status", "New status", "Notes", "Evidence URL", "Next review due"];
  const rows = logs.map((log) => {
    const m = log.metadata ?? {};
    return [
      new Date(log.createdAt).toLocaleString("en-GB"),
      log.userName,
      m.standardTitle ?? "",
      m.itemTitle ?? "",
      m.previousStatus ? STATUS_LABELS[m.previousStatus] : "",
      m.status ? STATUS_LABELS[m.status] : "",
      m.evidenceNotes ?? "",
      m.evidenceUrl ?? "",
      m.nextReviewDue ? new Date(m.nextReviewDue).toLocaleDateString("en-GB") : "",
    ]
      .map(csvCell)
      .join(",");
  });
  return [header.map(csvCell).join(","), ...rows].join("\n");
}

/** Reviewable, printable, exportable log of compliance-assessment changes — used on both the school dashboard and the super-admin school view. */
export function ComplianceLogs({ endpoint }: { endpoint: string }) {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then(setLogs);
  }, [endpoint]);

  function exportCsv() {
    if (!logs) return;
    const blob = new Blob([toCsv(logs)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!logs) return <p className="p-5 text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 print:hidden">
        <div>
          <h2 className="font-semibold text-slate-900">Activity log</h2>
          <p className="text-xs text-slate-500">
            Every change made to a compliance answer, with who made it and when — most recent {logs.length} entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={logs.length === 0}>
            <Download size={13} />
            Save as CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={logs.length === 0}>
            <Printer size={13} />
            Print
          </Button>
        </div>
      </div>

      <div className="hidden items-center justify-between px-5 pt-5 print:flex">
        <h2 className="font-semibold text-slate-900">Compliance activity log</h2>
        <p className="text-xs text-slate-500">Printed {new Date().toLocaleString("en-GB")}</p>
      </div>

      {logs.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No changes have been logged yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log) => {
            const m = log.metadata ?? {};
            return (
              <div key={log.id} className="break-inside-avoid px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {m.standardTitle ?? "Compliance item"}
                    {m.itemTitle && <span className="font-normal text-slate-500"> — {m.itemTitle}</span>}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("en-GB")}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{log.userName}</span>
                  {log.action === "compliance.assessed_by_super_admin" && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      Platform admin
                    </span>
                  )}
                  {m.status && (
                    <span className="flex items-center gap-1.5">
                      {m.previousStatus && m.previousStatus !== m.status && (
                        <>
                          <ComplianceBadge status={m.previousStatus} />
                          <span>&rarr;</span>
                        </>
                      )}
                      <ComplianceBadge status={m.status} />
                    </span>
                  )}
                </div>
                {m.evidenceNotes && <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-600">{m.evidenceNotes}</p>}
                {(m.evidenceUrl || m.nextReviewDue) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-slate-400">
                    {m.evidenceUrl && <span>Evidence: {m.evidenceUrl}</span>}
                    {m.nextReviewDue && <span>Next review due {new Date(m.nextReviewDue).toLocaleDateString("en-GB")}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
