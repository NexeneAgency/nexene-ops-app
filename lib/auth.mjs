import { createHash, randomBytes } from "node:crypto";
import { db } from "./db.mjs";
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function currentUser(request) {
  const cookie = (request.headers.get("cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("ops_session="))
    ?.slice(12);
  if (!cookie) return null;
  return (
    db()
      .prepare(
        "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?",
      )
      .get(hash(cookie), Date.now()) || null
  );
}
export function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  db()
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(hash(token), userId, Date.now() + 7 * 86400000);
  return token;
}
export function sessionCookie(token, clear = false) {
  const secure = (process.env.APP_URL || "").startsWith("https:");
  return `ops_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 604800}${secure ? "; Secure" : ""}`;
}
export function issueLogin(email) {
  const sql = db(),
    now = Date.now(),
    key = hash(email);
  sql.prepare("DELETE FROM login_limits WHERE expires<?").run(now);
  sql.prepare("DELETE FROM auth_tokens WHERE expires<?").run(now);
  sql.prepare("DELETE FROM sessions WHERE expires<?").run(now);
  const limit = sql.prepare("SELECT * FROM login_limits WHERE key=?").get(key);
  if (limit?.count >= 5) return null;
  sql
    .prepare(
      "INSERT INTO login_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
    )
    .run(key, now + 15 * 60000);
  const user = sql
    .prepare(
      "SELECT id FROM users WHERE email=? AND (role='admin' OR customer_id IS NOT NULL)",
    )
    .get(email);
  if (!user) return null;
  const token = randomBytes(32).toString("hex");
  sql
    .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
    .run(hash(token), user.id, now + 15 * 60000);
  return token;
}
export function redeemLogin(token) {
  return db()
    .prepare(
      "DELETE FROM auth_tokens WHERE hash=? AND expires>? RETURNING user_id",
    )
    .get(hash(token), Date.now())?.user_id;
}
export async function sendLogin(email, token) {
  const link = `${process.env.APP_URL || "http://localhost:3000"}/?token=${token}`;
  if (
    process.env.DEV_MAIL_LOG === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    console.info(`[Development login] ${email}: ${link}`);
    return;
  }
  if (!process.env.SMTP_HOST) throw new Error("SMTP is not configured");
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_SECURE !== "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Dein Zugang zu Nexene Ops / Your sign-in link",
    text: `Nexene Ops\n\nAnmelden / Sign in: ${link}\n\nDieser Link ist 15 Minuten gültig und einmal verwendbar. / Valid for 15 minutes, single use.`,
  });
}
