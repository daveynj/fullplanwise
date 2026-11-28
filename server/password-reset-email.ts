import { siteFacts } from "../shared/site-facts";
import type { MailMessage } from "./mailer";

/** How long a reset link works. */
export const RESET_LINK_MINUTES = 60;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "Maria" from "Maria Silva"; nothing from an email-like or empty name. */
export function firstName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return /^[\p{L}][\p{L}'’-]{0,39}$/u.test(first) ? first : "";
}

/** The email a teacher gets when they ask to set a new password. */
export function buildPasswordResetEmail(to: string, fullName: string | null | undefined, link: string): MailMessage {
  const name = firstName(fullName);
  const hello = name ? `Hi ${name},` : "Hi there,";
  const lines = [
    `Here is your link to set a new ${siteFacts.brand} password:`,
    `It works once, for the next ${RESET_LINK_MINUTES} minutes. After you set the password you are signed in straight away.`,
    "If you didn't ask for this, ignore this email: your password stays as it is.",
  ];
  const text = [hello, "", lines[0], link, "", lines[1], "", lines[2], "", "Dave", `${siteFacts.brand}`].join("\n");
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#222222;">
<p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
<p style="margin:0 0 16px;">${escapeHtml(lines[0])}</p>
<p style="margin:0 0 20px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#edc437;color:#051d40;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:6px;">Set a new password</a></p>
<p style="margin:0 0 16px;font-size:14px;color:#555555;">Or copy this address into your browser:<br><a href="${escapeHtml(link)}" style="color:#0b5cad;word-break:break-all;">${escapeHtml(link)}</a></p>
<p style="margin:0 0 16px;">${escapeHtml(lines[1])}</p>
<p style="margin:0 0 16px;">${escapeHtml(lines[2])}</p>
<p style="margin:0;">Dave<br>${escapeHtml(siteFacts.brand)}</p>
</body></html>`;
  return { to, subject: `Set a new ${siteFacts.brand} password`, text, html };
}

/**
 * A small in-memory limit: at most `max` events per key in `windowMs`.
 * Enough for password-reset requests (a handful an hour for one address).
 */
export class RecentLimit {
  private events = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}

  /** Records the event and returns true, or returns false when the key is over its limit. */
  allow(key: string, now: number = Date.now()): boolean {
    const recent = (this.events.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.events.set(key, recent);
      return false;
    }
    recent.push(now);
    this.events.set(key, recent);
    // Keep the map from growing without end.
    if (this.events.size > 5000) {
      this.events.forEach((times, k) => {
        if (!times.some((t) => now - t < this.windowMs)) this.events.delete(k);
      });
    }
    return true;
  }
}
