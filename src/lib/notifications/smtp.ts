import nodemailer from "nodemailer";
import type { EmailMessage, NotificationProvider } from "./types";

/**
 * SMTP-backed notification provider. Deliberately only ever calls
 * `sendMail` with plain `to`/`subject`/`text`/`html` fields — never the
 * `raw` option, which has an unpatched advisory allowing it to read local
 * files / hit arbitrary URLs even with `disableFileAccess`/
 * `disableUrlAccess` set (https://github.com/advisories/GHSA-p6gq-j5cr-w38f).
 * Those two flags are still set below as defense-in-depth against the
 * (non-`raw`) attachment path/URL vectors, which they do cover. Callers are
 * responsible for HTML-escaping any user-supplied text before it reaches
 * `html` here — this class doesn't sanitize it.
 */
export class SmtpNotificationProvider implements NotificationProvider {
  readonly name = "smtp" as const;
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(opts: { host: string; port: number; secure: boolean; user?: string; pass?: string; from: string }) {
    this.transporter = nodemailer.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.secure,
      auth: opts.user && opts.pass ? { user: opts.user, pass: opts.pass } : undefined,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    this.from = opts.from;
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
