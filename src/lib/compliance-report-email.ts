import type { ComplianceStatus, Priority } from "@prisma/client";
import { escapeHtml, safeHref } from "@/lib/email-html";
import { isCoreStandard } from "@/lib/dfe-standards";

const STATUS_LABEL: Record<ComplianceStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-compliant",
  NOT_APPLICABLE: "Not applicable",
};

const STATUS_COLOR: Record<ComplianceStatus, { bg: string; fg: string; bar: string }> = {
  NOT_STARTED: { bg: "#f1f5f9", fg: "#475569", bar: "#94a3b8" },
  IN_PROGRESS: { bg: "#fffbeb", fg: "#b45309", bar: "#f59e0b" },
  COMPLIANT: { bg: "#ecfdf5", fg: "#047857", bar: "#10b981" },
  NON_COMPLIANT: { bg: "#fef2f2", fg: "#b91c1c", bar: "#ef4444" },
  NOT_APPLICABLE: { bg: "#f1f5f9", fg: "#64748b", bar: "#94a3b8" },
};

type Assessment = {
  status: ComplianceStatus;
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  nextReviewDue: Date | null;
};
type Item = { id: string; title: string; priority: Priority };
type Standard = { id: string; code: string; title: string; items: Item[] };

export function buildComplianceReportEmail(params: {
  tenantName: string;
  timezone: string;
  standards: Standard[];
  assessmentByItem: Map<string, Assessment>;
  appUrl?: string;
}) {
  const { tenantName, timezone, standards, assessmentByItem, appUrl } = params;

  const allItems = standards.flatMap((s) => s.items);
  const statusOf = (item: Item) => assessmentByItem.get(item.id)?.status ?? "NOT_STARTED";
  const compliantCount = allItems.filter((i) => statusOf(i) === "COMPLIANT").length;
  const overallPct = allItems.length ? Math.round((compliantCount / allItems.length) * 100) : 0;
  const generated = new Date().toLocaleString("en-GB", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  const flagged = standards.flatMap((standard) =>
    standard.items
      .filter((item) => statusOf(item) === "NON_COMPLIANT" || statusOf(item) === "IN_PROGRESS")
      .map((item) => ({ standard, item, assessment: assessmentByItem.get(item.id) })),
  );
  // Non-compliant first — that's what needs action soonest.
  flagged.sort((a, b) => (a.assessment?.status === b.assessment?.status ? 0 : a.assessment?.status === "NON_COMPLIANT" ? -1 : 1));

  const subject = `${tenantName} — DfE compliance report (${overallPct}% ready)`;

  // ---- plain-text fallback ----
  const textLines: string[] = [
    "DfE Digital & Technology Standards — Compliance Report",
    tenantName,
    `Generated: ${generated}`,
    "",
    `Overall readiness: ${compliantCount}/${allItems.length} standards met (${overallPct}%)`,
    "",
    "By standard:",
  ];
  for (const standard of standards) {
    const met = standard.items.filter((i) => statusOf(i) === "COMPLIANT").length;
    textLines.push(`  ${standard.title}: ${met}/${standard.items.length} met`);
  }
  textLines.push("");
  if (flagged.length > 0) {
    textLines.push("Needs attention:");
    for (const { standard, item, assessment } of flagged) {
      textLines.push(`  [${STATUS_LABEL[assessment!.status]}] ${item.title} (${standard.title})`);
      if (assessment?.evidenceNotes) textLines.push(`    Notes: ${assessment.evidenceNotes}`);
      if (assessment?.evidenceUrl) textLines.push(`    Evidence: ${assessment.evidenceUrl}`);
      if (assessment?.nextReviewDue) textLines.push(`    Review due: ${new Date(assessment.nextReviewDue).toLocaleDateString("en-GB")}`);
    }
  } else {
    textLines.push("Nothing flagged as non-compliant or in progress right now.");
  }
  textLines.push("");
  textLines.push(
    "This is a working self-assessment, not an official DfE certification. Always check the latest guidance at https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges before reporting compliance externally.",
  );
  if (appUrl) textLines.push(`Full checklist: ${appUrl}/dashboard/compliance`);
  const text = textLines.join("\n");

  // ---- HTML ----
  const standardRows = standards
    .map((standard) => {
      const met = standard.items.filter((i) => statusOf(i) === "COMPLIANT").length;
      const total = standard.items.length;
      const pct = total ? Math.round((met / total) * 100) : 0;
      return `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #f1f5f9;font-size:13px;color:#0f172a;">
            ${escapeHtml(standard.title)}
            ${isCoreStandard(standard.code) ? `<span style="margin-left:6px;display:inline-block;padding:1px 6px;border-radius:99px;background:#0f172a;color:#ffffff;font-size:9px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;vertical-align:middle;">Core</span>` : ""}
          </td>
          <td style="padding:10px 0;border-top:1px solid #f1f5f9;width:120px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="height:6px;border-radius:3px;background:#10b981;width:${pct}%;font-size:0;line-height:0;">&nbsp;</td>
              <td style="height:6px;border-radius:3px;background:#e2e8f0;width:${100 - pct}%;font-size:0;line-height:0;">&nbsp;</td>
            </tr></table>
          </td>
          <td style="padding:10px 0 10px 12px;border-top:1px solid #f1f5f9;font-size:12px;color:#64748b;text-align:right;white-space:nowrap;">${met}/${total}</td>
        </tr>`;
    })
    .join("");

  const flaggedHtml = flagged.length
    ? flagged
        .map(({ standard, item, assessment }) => {
          const colors = STATUS_COLOR[assessment!.status];
          const url = assessment?.evidenceUrl ? safeHref(assessment.evidenceUrl) : null;
          return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-left:3px solid ${colors.bar};background:#f8fafc;border-radius:6px;">
            <tr><td style="padding:12px 14px;">
              <span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${colors.bg};color:${colors.fg};font-size:11px;font-weight:600;">${STATUS_LABEL[assessment!.status]}</span>
              <div style="margin-top:6px;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(item.title)}</div>
              <div style="font-size:12px;color:#94a3b8;">${escapeHtml(standard.title)}</div>
              ${assessment?.evidenceNotes ? `<div style="margin-top:6px;font-size:12px;color:#475569;">${escapeHtml(assessment.evidenceNotes)}</div>` : ""}
              ${url ? `<div style="margin-top:4px;"><a href="${url}" style="font-size:12px;color:#0f172a;">${escapeHtml(assessment!.evidenceUrl!)}</a></div>` : ""}
              ${assessment?.nextReviewDue ? `<div style="margin-top:4px;font-size:11px;color:#94a3b8;">Review due ${new Date(assessment.nextReviewDue).toLocaleDateString("en-GB")}</div>` : ""}
            </td></tr>
          </table>`;
        })
        .join("")
    : `<p style="margin:10px 0 0;font-size:13px;color:#64748b;">Nothing flagged as non-compliant or in progress right now.</p>`;

  const html = `
<div style="background:#f7f7f8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr>
      <td style="background:#0f172a;padding:28px 28px 24px;color:#ffffff;">
        <div style="font-size:13px;font-weight:600;letter-spacing:.02em;opacity:.75;">SCHOOLS COMPLIANCE</div>
        <div style="margin-top:10px;font-size:22px;font-weight:700;">${escapeHtml(tenantName)}</div>
        <div style="margin-top:2px;font-size:12px;color:#cbd5e1;">DfE digital &amp; technology standards — generated ${generated}</div>
        <div style="margin-top:18px;font-size:34px;font-weight:800;">${overallPct}%<span style="font-size:14px;font-weight:600;color:#cbd5e1;"> ready</span></div>
        <div style="margin-top:4px;font-size:12px;color:#cbd5e1;">${compliantCount} of ${allItems.length} standards met</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 8px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.03em;color:#64748b;text-transform:uppercase;">By standard</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
          ${standardRows}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 8px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.03em;color:#64748b;text-transform:uppercase;">Needs attention</div>
        ${flaggedHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 28px;">
        ${appUrl ? `<a href="${escapeHtml(appUrl)}/dashboard/compliance" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Open full checklist</a>` : ""}
        <p style="margin:18px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;">
          This is a working self-assessment, not an official DfE certification. Always check the latest guidance on
          <a href="https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges" style="color:#64748b;">GOV.UK</a>
          before reporting compliance externally.
        </p>
      </td>
    </tr>
  </table>
</div>`;

  return { subject, text, html };
}
