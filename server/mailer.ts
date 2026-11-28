import tls from "node:tls";
import { randomBytes } from "node:crypto";

/**
 * Sends the app's own emails (password resets) through an ordinary mailbox
 * over SMTP with TLS from the first byte (port 465). Written against Node's
 * built-in `tls` so no package has to be added.
 *
 * Settings (deployment secrets): SMTP_USER and SMTP_PASS are required;
 * SMTP_HOST (default: the Fasthosts server the planwiseesl.com mailbox uses),
 * SMTP_PORT (default 465) and SMTP_FROM are optional. Without SMTP_USER and
 * SMTP_PASS nothing is sent and `mailConfig()` returns null.
 */
export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** The minimum of a socket the sender needs; lets tests script a server. */
export interface MailSocket {
  on(event: "data", listener: (chunk: Buffer | string) => void): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
  on(event: "close", listener: () => void): unknown;
  write(data: string): unknown;
  end(): unknown;
  destroy(): unknown;
  setTimeout?(ms: number, listener: () => void): unknown;
}

export class MailError extends Error {
  constructor(public step: string, public code: number | null, message: string) {
    super(message);
  }
}

const DEFAULT_HOST = "smtp.livemail.co.uk";
const TIMEOUT_MS = 15_000;
// One address, no spaces, angle brackets, quotes or control characters: nothing
// that could add a second recipient or a header.
const ADDRESS = /^[^\s<>"',;:()\[\]\\\u0000-\u001f]+@[^\s<>"',;:()\[\]\\@\u0000-\u001f]+\.[^\s<>"',;:()\[\]\\@\u0000-\u001f]+$/;

export function isEmailAddress(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && ADDRESS.test(value);
}

export function mailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig | null {
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  if (!user || !pass || !isEmailAddress(user)) return null;
  const port = Number(env.SMTP_PORT);
  return {
    host: env.SMTP_HOST?.trim() || DEFAULT_HOST,
    port: Number.isInteger(port) && port > 0 ? port : 465,
    user,
    pass,
    from: env.SMTP_FROM?.trim() || `PlanWise ESL <${user}>`,
  };
}

const b64 = (value: string) => Buffer.from(value, "utf8").toString("base64");
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const wrap76 = (value: string) => value.replace(/(.{76})/g, "$1\r\n");

/** The address inside "Name <address>", or the value itself. */
export function addressOf(from: string): string {
  return (from.match(/<([^<>]+)>\s*$/)?.[1] ?? from).trim();
}

function encodeHeader(value: string): string {
  const clean = oneLine(value);
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${b64(clean)}?=`;
}

function fromHeader(from: string): string {
  const address = addressOf(from);
  const name = oneLine(from.replace(/<[^<>]+>\s*$/, "")).replace(/"/g, "");
  return name && name !== address ? `${encodeHeader(name)} <${address}>` : address;
}

/** The full message as sent after DATA: CRLF line ends, base64 bodies. */
export function buildMimeMessage(config: Pick<MailConfig, "from">, message: MailMessage, now: Date = new Date()): string {
  const boundary = `pw-${randomBytes(12).toString("hex")}`;
  const domain = addressOf(config.from).split("@")[1] || "localhost";
  const headers = [
    `From: ${fromHeader(config.from)}`,
    `To: ${message.to}`,
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${now.toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${randomBytes(16).toString("hex")}@${domain}>`,
    "MIME-Version: 1.0",
    // Tells mail programs this is an automatic message (no out-of-office replies).
    "Auto-Submitted: auto-generated",
  ];
  const part = (type: string, body: string) =>
    [`Content-Type: ${type}; charset=utf-8`, "Content-Transfer-Encoding: base64", "", wrap76(b64(body))].join("\r\n");
  if (!message.html) {
    return [...headers, part("text/plain", message.text)].join("\r\n");
  }
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    part("text/plain", message.text),
    `--${boundary}`,
    part("text/html", message.html),
    `--${boundary}--`,
  ].join("\r\n");
}

/**
 * Sends one message. Resolves when the server has accepted it; rejects with a
 * MailError naming the step otherwise. The password is never put in an error.
 */
export function sendMail(
  message: MailMessage,
  config: MailConfig | null = mailConfig(),
  connect: (config: MailConfig) => MailSocket = (c) => tls.connect({ host: c.host, port: c.port, servername: c.host }),
): Promise<void> {
  if (!config) return Promise.reject(new MailError("config", null, "Email sending is not set up (SMTP_USER and SMTP_PASS)."));
  if (!isEmailAddress(message.to)) return Promise.reject(new MailError("recipient", null, "The recipient is not a valid email address."));

  const data = buildMimeMessage(config, message)
    // A line that is only a dot would end the message early.
    .replace(/^\./gm, "..");
  // Each step: what to send once the previous reply arrives, and the reply codes that mean "go on".
  const steps: Array<{ name: string; send: string | null; expect: number[] }> = [
    { name: "greeting", send: null, expect: [220] },
    { name: "hello", send: "EHLO planwiseesl.com", expect: [250] },
    { name: "sign-in", send: "AUTH LOGIN", expect: [334] },
    { name: "sign-in", send: b64(config.user), expect: [334] },
    { name: "sign-in", send: b64(config.pass), expect: [235] },
    { name: "sender", send: `MAIL FROM:<${addressOf(config.from)}>`, expect: [250] },
    { name: "recipient", send: `RCPT TO:<${message.to}>`, expect: [250, 251] },
    { name: "data", send: "DATA", expect: [354] },
    { name: "message", send: `${data}\r\n.`, expect: [250] },
    { name: "quit", send: "QUIT", expect: [221] },
  ];

  return new Promise<void>((resolve, reject) => {
    const socket = connect(config);
    let buffer = "";
    let index = 0;
    let settled = false;
    let accepted = false;
    const finish = (error?: MailError) => {
      if (settled) return;
      settled = true;
      try { error ? socket.destroy() : socket.end(); } catch { /* already closed */ }
      error ? reject(error) : resolve();
    };
    const fail = (step: string, code: number | null, detail: string) =>
      // The message was accepted: a problem while saying goodbye is not a failure.
      accepted ? finish() : finish(new MailError(step, code, `Email not sent (${step}${code ? `, ${code}` : ""}): ${detail}`));

    socket.setTimeout?.(TIMEOUT_MS, () => fail(steps[Math.min(index, steps.length - 1)].name, null, "the mail server did not answer in time"));
    socket.on("error", (error) => fail(steps[Math.min(index, steps.length - 1)].name, null, oneLine(error.message)));
    socket.on("close", () => fail(steps[Math.min(index, steps.length - 1)].name, null, "the mail server closed the connection"));
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      // A reply can span lines ("250-..."); its last line has a space after the code.
      while (true) {
        const match = buffer.match(/^(?:\d{3}-[^\r\n]*\r?\n)*(\d{3})(?: ([^\r\n]*))?\r?\n/);
        if (!match) return;
        buffer = buffer.slice(match[0].length);
        const step = steps[index];
        const code = Number(match[1]);
        if (!step.expect.includes(code)) return fail(step.name, code, oneLine(match[2] ?? '').slice(0, 200));
        if (step.name === "message") accepted = true;
        index += 1;
        if (index >= steps.length) return finish();
        socket.write(`${steps[index].send}\r\n`);
      }
    });
  });
}
