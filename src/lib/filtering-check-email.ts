import type { CheckOutcome } from "@prisma/client";
import { escapeHtml } from "@/lib/email-html";

const OUTCOME_LABEL: Record<CheckOutcome, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  NOT_APPLICABLE: "N/A",
  NOT_TESTED: "Not tested",
};

const OUTCOME_COLOR: Record<CheckOutcome, { bg: string; fg: string }> = {
  PASS: { bg: "#ecfdf5", fg: "#047857" },
  FAIL: { bg: "#fef2f2", fg: "#b91c1c" },
  NOT_APPLICABLE: { bg: "#f1f5f9", fg: "#64748b" },
  NOT_TESTED: { bg: "#f1f5f9", fg: "#64748b" },
};

type Result = { title: string; outcome: CheckOutcome; actionNotes: string | null };
type Device = { label: string; results: Result[] };

export function buildFilteringCheckEmail(params: {
  tenantName: string;
  dslName: string | null;
  timezone: string;
  performedAt: Date;
  performedByName: string;
  notes: string | null;
  devices: Device[];
}) {
  const { tenantName, dslName, timezone, performedAt, performedByName, notes, devices } = params;

  const allResults = devices.flatMap((d) => d.results);
  const failCount = allResults.filter((r) => r.outcome === "FAIL").length;
  const performedDate = performedAt.toLocaleDateString("en-GB", { timeZone: timezone, dateStyle: "long" });
  const greeting = dslName ? dslName.split(" ")[0] : "there";

  const subject = failCount > 0
    ? `${tenantName} — Filtering & Monitoring check (${failCount} issue${failCount === 1 ? "" : "s"} found)`
    : `${tenantName} — Filtering & Monitoring check (all clear)`;

  // ---- plain text ----
  const textLines: string[] = [
    "Filtering & Monitoring Check Report",
    tenantName,
    `Performed by ${performedByName} on ${performedDate}`,
    "",
  ];
  if (notes) {
    textLines.push("Visit notes:", notes, "");
  }
  for (const device of devices) {
    textLines.push(`== ${device.label} ==`);
    for (const r of device.results) {
      textLines.push(`  [${OUTCOME_LABEL[r.outcome]}] ${r.title}`);
      if (r.actionNotes) textLines.push(`    Action: ${r.actionNotes}`);
    }
    textLines.push("");
  }
  const text = textLines.join("\n");

  // ---- HTML ----
  const deviceSections = devices
    .map((device) => {
      const rows = device.results
        .map((r) => {
          const colors = OUTCOME_COLOR[r.outcome];
          return `
          <tr>
            <td style="padding:8px 0;border-top:1px solid #f1f5f9;font-size:13px;color:#0f172a;vertical-align:top;">
              ${escapeHtml(r.title)}
              ${r.actionNotes ? `<div style="margin-top:2px;font-size:12px;color:#64748b;">${escapeHtml(r.actionNotes)}</div>` : ""}
            </td>
            <td style="padding:8px 0;border-top:1px solid #f1f5f9;text-align:right;white-space:nowrap;vertical-align:top;">
              <span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${colors.bg};color:${colors.fg};font-size:11px;font-weight:600;">${OUTCOME_LABEL[r.outcome]}</span>
            </td>
          </tr>`;
        })
        .join("");
      return `
      <div style="margin-top:16px;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(device.label)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">${rows}</table>
      </div>`;
    })
    .join("");

  const html = `
<div style="background:#f7f7f8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr>
      <td style="background:#0f172a;padding:28px 28px 24px;color:#ffffff;">
        <div style="font-size:13px;font-weight:600;letter-spacing:.02em;opacity:.75;">SCHOOLS COMPLIANCE</div>
        <div style="margin-top:10px;font-size:20px;font-weight:700;">Filtering &amp; Monitoring check</div>
        <div style="margin-top:2px;font-size:12px;color:#cbd5e1;">${escapeHtml(tenantName)} — performed by ${escapeHtml(performedByName)} on ${performedDate}</div>
        <div style="margin-top:14px;font-size:13px;font-weight:600;color:${failCount > 0 ? "#fca5a5" : "#86efac"};">
          ${failCount > 0 ? `${failCount} check${failCount === 1 ? "" : "s"} need${failCount === 1 ? "s" : ""} attention` : "All checks passed"}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 28px 8px;">
        <p style="margin:0;font-size:13px;color:#334155;">Hi ${escapeHtml(greeting)},</p>
        <p style="margin:8px 0 0;font-size:13px;color:#334155;">
          Here's the outcome of the Filtering &amp; Monitoring check carried out at ${escapeHtml(tenantName)}.
        </p>
        ${notes ? `<p style="margin:10px 0 0;font-size:12px;color:#64748b;background:#f8fafc;border-radius:8px;padding:10px 12px;">${escapeHtml(notes)}</p>` : ""}
        ${deviceSections}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">
          This report was generated by Schools Compliance. If anything above needs following up, please raise it with your IT support.
        </p>
      </td>
    </tr>
  </table>
</div>`;

  return { subject, text, html };
}
