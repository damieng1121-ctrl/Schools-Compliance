import { escapeHtml } from "@/lib/email-html";

/**
 * The "here's your login" email sent whenever an account is created with a
 * temporary password — new school signup, added to a school, made a
 * platform admin, invited by a colleague. One shared template so all of
 * those look and read the same.
 */
export function buildWelcomeEmail(params: {
  subject: string;
  recipientName: string;
  /** One sentence of context, e.g. "You've been added as an admin on Demo School's compliance dashboard." */
  intro: string;
  email: string;
  tempPassword: string;
  appUrl?: string;
}) {
  const { subject, recipientName, intro, email, tempPassword, appUrl } = params;
  const loginUrl = `${appUrl ?? "http://localhost:3004"}/login`;
  const firstName = recipientName.trim().split(/\s+/)[0] || recipientName;

  const text = [
    `Hi ${recipientName},`,
    "",
    intro,
    "",
    `Sign in at ${loginUrl} with:`,
    `  Email: ${email}`,
    `  Temporary password: ${tempPassword}`,
    "",
    "You'll be able to change your password once signed in.",
  ].join("\n");

  const html = `
<div style="background:#f7f7f8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr>
      <td style="background:#0f172a;padding:28px;color:#ffffff;">
        <div style="font-size:13px;font-weight:600;letter-spacing:.02em;opacity:.75;">SCHOOLS COMPLIANCE</div>
        <div style="margin-top:10px;font-size:22px;font-weight:700;">You&rsquo;re in, ${escapeHtml(firstName)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 8px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">Hi ${escapeHtml(recipientName)},</p>
        <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.04em;color:#94a3b8;text-transform:uppercase;">Email</div>
              <div style="margin-top:2px;font-size:14px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${escapeHtml(email)}</div>
              <div style="margin-top:14px;font-size:11px;font-weight:700;letter-spacing:.04em;color:#94a3b8;text-transform:uppercase;">Temporary password</div>
              <div style="margin-top:2px;font-size:14px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${escapeHtml(tempPassword)}</div>
            </td>
          </tr>
        </table>

        <div style="margin-top:22px;">
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:11px 22px;border-radius:8px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Sign in</a>
        </div>

        <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">
          You&rsquo;ll be able to change your password once signed in. If you weren&rsquo;t expecting this email, you can ignore it.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 24px;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#cbd5e1;">
          Sent by Schools Compliance on behalf of Education Lincs.
        </p>
      </td>
    </tr>
  </table>
</div>`;

  return { subject, text, html };
}
