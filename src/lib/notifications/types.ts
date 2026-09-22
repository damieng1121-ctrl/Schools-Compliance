export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML body. Sent alongside `text` as a multipart/alternative fallback. */
  html?: string;
}

export interface NotificationProvider {
  readonly name: "smtp" | "console" | "disabled";
  send(message: EmailMessage): Promise<void>;
}
