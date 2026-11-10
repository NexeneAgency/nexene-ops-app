import { randomUUID } from "node:crypto";
export const usersMigration = `
 ALTER TABLE users ADD COLUMN last_login_at TEXT;
 ALTER TABLE users ADD COLUMN login_state TEXT NOT NULL DEFAULT 'unknown' CHECK(login_state IN ('unknown','never','estimated','tracked'));
 ALTER TABLE users ADD COLUMN deleted_at TEXT;
 ALTER TABLE users ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
 UPDATE users SET last_login_at=strftime('%Y-%m-%dT%H:%M:%fZ',((SELECT MAX(expires) FROM sessions WHERE sessions.user_id=users.id)-604800000)/1000.0,'unixepoch'),login_state='estimated' WHERE EXISTS(SELECT 1 FROM sessions WHERE sessions.user_id=users.id);
 UPDATE users SET deleted_at=CURRENT_TIMESTAMP WHERE role='customer' AND customer_id IS NULL;
 CREATE TABLE bootstrap_admin_emails(email TEXT PRIMARY KEY);
 INSERT OR IGNORE INTO bootstrap_admin_emails SELECT email FROM users WHERE role='admin';
 INSERT INTO schema_migrations VALUES(6);
`;
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const text = (value, max = 250) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
export async function manageUser(sql, actor, id, method, body = {}) {
  return sql.transaction(async (tx) => {
    const current = await tx
      .prepare(
        "SELECT id FROM users WHERE id=? AND role='admin' AND deleted_at IS NULL",
      )
      .get(actor.id);
    if (!current) fail("Nicht erlaubt / Forbidden", 403);
    const target = id
      ? await tx
          .prepare("SELECT * FROM users WHERE id=? AND deleted_at IS NULL")
          .get(id)
      : null;
    if (id && !target) fail("Zugang nicht gefunden / Access not found", 404);
    if (method === "DELETE") {
      if (id === actor.id)
        fail(
          "Du kannst deinen eigenen Zugang nicht löschen. / You cannot delete your own access.",
          403,
        );
      const admins = await tx
        .prepare(
          "SELECT count(*) n FROM users WHERE role='admin' AND deleted_at IS NULL",
        )
        .get();
      if (target.role === "admin" && admins.n <= 1)
        fail(
          "Der letzte Admin kann nicht entfernt werden. / The last admin cannot be removed.",
          409,
        );
      await tx.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
      await tx.prepare("DELETE FROM auth_tokens WHERE user_id=?").run(id);
      await tx
        .prepare("UPDATE tasks SET assignee_id=NULL WHERE assignee_id=?")
        .run(id);
      await tx
        .prepare("UPDATE users SET deleted_at=?,revision=revision+1 WHERE id=?")
        .run(new Date().toISOString(), id);
      return { ok: true };
    }
    if (
      target &&
      body.expected_revision !== undefined &&
      body.expected_revision !== target.revision
    )
      fail(
        "Der Zugang wurde zwischenzeitlich geändert. Bitte den aktuellen Stand laden. / This access was changed. Load the latest version.",
        409,
      );
    const name = body.name === undefined ? target?.name : text(body.name),
      email = (
        body.email === undefined ? target?.email : text(body.email, 254)
      )?.toLowerCase(),
      role = body.role ?? target?.role ?? "customer";
    if (!name) fail("Bitte einen Namen eingeben. / Enter a name.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(
        "Bitte eine gültige E-Mail-Adresse eingeben. / Enter a valid email address.",
      );
    if (!["admin", "customer"].includes(role))
      fail("Ungültige Rolle / Invalid role");
    const customer =
      role === "customer"
        ? text(
            body.customer_id === undefined
              ? target?.customer_id
              : body.customer_id,
          )
        : null;
    if (
      role === "customer" &&
      (!customer ||
        !(await tx
          .prepare("SELECT id FROM customers WHERE id=?")
          .get(customer)))
    )
      fail(
        "Bitte einen vorhandenen Kunden wählen. / Select an existing customer.",
      );
    if (target?.role === "admin" && role !== "admin") {
      if (id === actor.id)
        fail(
          "Du kannst deine eigene Adminrolle nicht entfernen. / You cannot remove your own admin role.",
          403,
        );
      const admins = await tx
        .prepare(
          "SELECT count(*) n FROM users WHERE role='admin' AND deleted_at IS NULL",
        )
        .get();
      if (admins.n <= 1)
        fail(
          "Der letzte Admin muss erhalten bleiben. / The last admin must remain.",
          409,
        );
    }
    if (target) {
      const duplicate = await tx
        .prepare("SELECT id FROM users WHERE email=? AND id<>?")
        .get(email, id);
      if (duplicate)
        fail(
          "Diese E-Mail-Adresse ist bereits vergeben. / This email address is already in use.",
          409,
        );
      const scopeChanged =
        email !== target.email ||
        role !== target.role ||
        customer !== target.customer_id;
      if (scopeChanged) {
        await tx.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
        await tx.prepare("DELETE FROM auth_tokens WHERE user_id=?").run(id);
      }
      if (role !== "admin")
        await tx
          .prepare("UPDATE tasks SET assignee_id=NULL WHERE assignee_id=?")
          .run(id);
      await tx
        .prepare(
          "UPDATE users SET name=?,email=?,role=?,customer_id=?,revision=revision+1 WHERE id=?",
        )
        .run(name, email, role, customer, id);
    } else {
      const previous = await tx
        .prepare("SELECT * FROM users WHERE email=?")
        .get(email);
      if (previous && !previous.deleted_at)
        fail(
          "Diese E-Mail-Adresse hat bereits einen Zugang. / This email address already has access.",
          409,
        );
      id = previous?.id || randomUUID();
      if (previous)
        await tx
          .prepare(
            "UPDATE users SET name=?,role=?,customer_id=?,deleted_at=NULL,revision=revision+1 WHERE id=?",
          )
          .run(name, role, customer, id);
      else
        await tx
          .prepare(
            "INSERT INTO users(id,name,email,role,customer_id,login_state) VALUES(?,?,?,?,?,'never')",
          )
          .run(id, name, email, role, customer);
    }
    if (role === "admin")
      await tx
        .prepare("INSERT OR IGNORE INTO bootstrap_admin_emails VALUES(?)")
        .run(email);
    return { ok: true, id };
  });
}
