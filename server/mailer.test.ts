// @vitest-environment node
import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { addressOf, buildMimeMessage, isEmailAddress, mailConfig, MailError, sendMail, type MailConfig } from "./mailer";

const config: MailConfig = {
  host: "smtp.example.test", port: 465, user: "dave@planwiseesl.com", pass: "s3cret-pass",
  from: "PlanWise ESL <dave@planwiseesl.com>",
};
const message = { to: "teacher@example.test", subject: "Set a new PlanWise ESL password", text: "Hello\n.\nBye", html: "<p>Hello</p>" };

/** A scripted mail server: answers each line the client writes with the next reply. */
class FakeServer extends EventEmitter {
  written: string[] = [];
  ended = false;
  destroyed = false;
  constructor(private replies: string[], greeting = "220 smtp.example.test ESMTP\r\n") {
    super();
    queueMicrotask(() => this.emit("data", greeting));
  }
  write(data: string) {
    this.written.push(data);
    const reply = this.replies.shift();
    if (reply) queueMicrotask(() => this.emit("data", reply));
  }
  end() { this.ended = true; }
  destroy() { this.destroyed = true; }
  setTimeout() {}
}
const happy = () => [
  "250-smtp.example.test greets you\r\n250-AUTH PLAIN LOGIN\r\n250 HELP\r\n", // EHLO (several lines)
  "334 VXNlcm5hbWU6\r\n", // AUTH LOGIN
  "334 UGFzc3dvcmQ6\r\n", // user
  "235 2.7.0 Authentication successful\r\n", // pass
  "250 2.1.0 Ok\r\n", // MAIL FROM
  "250 2.1.5 Ok\r\n", // RCPT TO
  "354 End data with <CR><LF>.<CR><LF>\r\n", // DATA
  "250 2.0.0 Ok: queued\r\n", // message
  "221 2.0.0 Bye\r\n", // QUIT
];

describe("mailConfig", () => {
  it("needs a mailbox and its password, and defaults to the Fasthosts server on port 465", () => {
    expect(mailConfig({})).toBeNull();
    expect(mailConfig({ SMTP_USER: "dave@planwiseesl.com" })).toBeNull();
    expect(mailConfig({ SMTP_USER: "not an address", SMTP_PASS: "x" })).toBeNull();
    expect(mailConfig({ SMTP_USER: " dave@planwiseesl.com ", SMTP_PASS: "x" })).toEqual({
      host: "smtp.livemail.co.uk", port: 465, user: "dave@planwiseesl.com", pass: "x",
      from: "PlanWise ESL <dave@planwiseesl.com>",
    });
    expect(mailConfig({ SMTP_USER: "a@b.co", SMTP_PASS: "x", SMTP_HOST: "mail.b.co", SMTP_PORT: "2465", SMTP_FROM: "B <a@b.co>" }))
      .toMatchObject({ host: "mail.b.co", port: 2465, from: "B <a@b.co>" });
  });
});

describe("isEmailAddress", () => {
  it("accepts one plain address and refuses anything that could add a recipient or a header", () => {
    expect(isEmailAddress("maria.silva+esl@example.co.uk")).toBe(true);
    for (const bad of ["", "no-at.example", "a@b", "a@b.co, c@d.co", "a@b.co\r\nBcc: x@y.co", "A <a@b.co>", "a b@c.co", 42, null]) {
      expect(isEmailAddress(bad), String(bad)).toBe(false);
    }
  });
});

describe("buildMimeMessage", () => {
  it("has the headers, both versions of the body, and no bare line breaks", () => {
    const mime = buildMimeMessage(config, { ...message, subject: "Réinitialiser\r\nBcc: x@y.co" }, new Date("2026-12-01T15:00:00Z"));
    expect(mime).toContain("From: PlanWise ESL <dave@planwiseesl.com>\r\n");
    expect(mime).toContain("To: teacher@example.test\r\n");
    // A non-ASCII subject is encoded, and a line break in it cannot start a new header.
    expect(mime).toMatch(/Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=\r\n/);
    expect(mime).not.toMatch(/^Bcc:/m);
    expect(mime).toContain("Date: Tue, 01 Dec 2026 15:00:00 +0000");
    expect(mime).toMatch(/Message-ID: <[0-9a-f]{32}@planwiseesl\.com>/);
    expect(mime).toContain("Content-Type: multipart/alternative;");
    expect(mime).toContain(Buffer.from("Hello\n.\nBye").toString("base64"));
    expect(mime).toContain(Buffer.from("<p>Hello</p>").toString("base64"));
    expect(mime.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("sends plain text alone when there is no HTML version", () => {
    const mime = buildMimeMessage(config, { to: "t@example.test", subject: "Test", text: "Hi" });
    expect(mime).toContain("Content-Type: text/plain; charset=utf-8");
    expect(mime).not.toContain("multipart/alternative");
  });

  it("reads the address out of a display name", () => {
    expect(addressOf("PlanWise ESL <dave@planwiseesl.com>")).toBe("dave@planwiseesl.com");
    expect(addressOf("dave@planwiseesl.com")).toBe("dave@planwiseesl.com");
  });
});

describe("sendMail", () => {
  it("signs in, names the sender and recipient, sends the message and says goodbye", async () => {
    const server = new FakeServer(happy());
    await sendMail(message, config, () => server);
    const lines = server.written.map((w) => w.replace(/\r\n$/, ""));
    expect(lines[0]).toBe("EHLO planwiseesl.com");
    expect(lines[1]).toBe("AUTH LOGIN");
    expect(lines[2]).toBe(Buffer.from("dave@planwiseesl.com").toString("base64"));
    expect(lines[3]).toBe(Buffer.from("s3cret-pass").toString("base64"));
    expect(lines[4]).toBe("MAIL FROM:<dave@planwiseesl.com>");
    expect(lines[5]).toBe("RCPT TO:<teacher@example.test>");
    expect(lines[6]).toBe("DATA");
    expect(lines[7].endsWith("\r\n.")).toBe(true);
    expect(lines[8]).toBe("QUIT");
    expect(server.ended).toBe(true);
  });

  it("copes with replies that arrive in pieces", async () => {
    const replies = happy();
    replies[0] = "250-smtp.example.test gre"; // the rest never comes in this chunk
    const server = new FakeServer(replies);
    const sending = sendMail(message, config, () => server);
    await new Promise((r) => setTimeout(r, 5));
    expect(server.written).toHaveLength(1); // still waiting for the end of the EHLO reply
    server.emit("data", "ets you\r\n250 HELP\r\n");
    await sending;
    expect(server.written).toHaveLength(9);
  });

  it("fails with the step and the server's code when sign-in is refused, without leaking the password", async () => {
    const replies = happy();
    replies[3] = "535 5.7.8 Authentication credentials invalid\r\n";
    const server = new FakeServer(replies);
    const error = await sendMail(message, config, () => server).catch((e) => e);
    expect(error).toBeInstanceOf(MailError);
    expect(error).toMatchObject({ step: "sign-in", code: 535 });
    expect(error.message).not.toContain("s3cret-pass");
    expect(error.message).not.toContain(Buffer.from("s3cret-pass").toString("base64"));
    expect(server.destroyed).toBe(true);
    expect(server.written.some((w) => w.startsWith("MAIL FROM"))).toBe(false);
  });

  it("fails when the server rejects the recipient or drops the connection", async () => {
    const replies = happy();
    replies[5] = "550 5.1.1 No such mailbox\r\n";
    await expect(sendMail(message, config, () => new FakeServer(replies))).rejects.toMatchObject({ step: "recipient", code: 550 });

    const dropped = new FakeServer([]);
    const sending = sendMail(message, config, () => dropped);
    await new Promise((r) => setTimeout(r, 5));
    dropped.emit("close");
    await expect(sending).rejects.toMatchObject({ step: "hello" });
  });

  it("counts the message as sent once the server has accepted it, even if the goodbye is lost", async () => {
    const replies = happy().slice(0, 8); // no reply to QUIT
    const server = new FakeServer(replies);
    const sending = sendMail(message, config, () => server);
    await new Promise((r) => setTimeout(r, 5));
    server.emit("close");
    await expect(sending).resolves.toBeUndefined();
  });

  it("sends nothing without settings or with a bad recipient", async () => {
    let connected = false;
    const connect = () => { connected = true; return new FakeServer(happy()); };
    await expect(sendMail(message, null, connect)).rejects.toMatchObject({ step: "config" });
    await expect(sendMail({ ...message, to: "a@b.co\r\nRCPT TO:<x@y.co>" }, config, connect)).rejects.toMatchObject({ step: "recipient" });
    expect(connected).toBe(false);
  });
});
