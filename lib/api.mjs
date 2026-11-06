import { db, uid, phases } from "./db.mjs";
import {
  currentUser,
  createSession,
  sessionCookie,
  issueLogin,
  redeemLogin,
  sendLogin,
  hash,
} from "./auth.mjs";

const json = (value, status = 200, headers = {}) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const str = (value, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const text = (value, max = 10000) =>
  typeof value === "string" ? value.slice(0, max) : "";
const date = (value) => {
  const s = str(value, 10);
  if (
    s &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(s) ||
      Number.isNaN(Date.parse(s)) ||
      new Date(s).toISOString().slice(0, 10) !== s)
  )
    fail("Ungültiges Datum / Invalid date");
  return s;
};
const number = (v, max = 10000000) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max)
    fail("Ungültiger Wert / Invalid value");
  return n;
};
const bool = (v) => (v === true || v === 1 ? 1 : 0);
function required(v) {
  if (!v) fail("Pflichtfeld fehlt / Required field missing");
  return v;
}
function admin(user) {
  if (user.role !== "admin") fail("Nicht erlaubt / Forbidden", 403);
}
function projectAccess(user, id) {
  const p = db().prepare("SELECT * FROM projects WHERE id=?").get(id);
  if (!p || (user.role !== "admin" && p.customer_id !== user.customer_id))
    fail("Nicht gefunden / Not found", 404);
  return p;
}
function entity(user, table, id) {
  const row = db().prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
  if (!row) fail("Nicht gefunden / Not found", 404);
  projectAccess(user, row.project_id);
  if (user.role !== "admin" && "visible" in row && !row.visible)
    fail("Nicht gefunden / Not found", 404);
  return row;
}
function url(value) {
  try {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol))
      fail("Ungültiger Link / Invalid link");
    return u.href;
  } catch {
    fail("Ungültiger Link / Invalid link");
  }
}
function docContent(value) {
  if (!value || typeof value !== "object" || value.type !== "doc")
    fail("Ungültiges Dokument / Invalid document");
  const s = JSON.stringify(value);
  if (s.length > 500000) fail("Dokument zu groß / Document too large");
  const check = (node, depth = 0) => {
    if (depth > 30 || !node || typeof node !== "object")
      fail("Ungültiges Dokument / Invalid document");
    if (
      node.type &&
      ![
        "doc",
        "paragraph",
        "text",
        "heading",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "codeBlock",
        "hardBreak",
        "horizontalRule",
      ].includes(node.type)
    )
      fail("Unbekannter Block / Unknown block");
    if (node.attrs?.href) url(node.attrs.href);
    if (node.marks)
      for (const mark of node.marks) {
        if (
          !["bold", "italic", "strike", "code", "link", "underline"].includes(
            mark.type,
          )
        )
          fail("Unbekannte Formatierung");
        if (mark.type === "link") url(mark.attrs?.href);
      }
    if (node.content) {
      if (!Array.isArray(node.content)) fail("Invalid content");
      for (const child of node.content) check(child, depth + 1);
    }
  };
  check(value);
  return s;
}
function state(user) {
  const sql = db(),
    isAdmin = user.role === "admin";
  const projects = sql
    .prepare(
      `SELECT p.*,c.name customer_name,c.initials,c.logo,c.color customer_color FROM projects p JOIN customers c ON c.id=p.customer_id ${isAdmin ? "" : "WHERE p.customer_id=?"} ORDER BY p.created_at DESC`,
    )
    .all(...(isAdmin ? [] : [user.customer_id]));
  if (!isAdmin)
    for (const p of projects) {
      delete p.budget;
      delete p.hours_budget;
      delete p.pricing;
    }
  const ids = new Set(projects.map((p) => p.id));
  const owned = (table) =>
    sql
      .prepare(`SELECT * FROM ${table}`)
      .all()
      .filter((row) => ids.has(row.project_id));
  const tasks = owned("tasks").filter((t) => isAdmin || t.visible);
  if (!isAdmin)
    for (const t of tasks) {
      delete t.assignee_id;
      if (!tasks.some((p) => p.id === t.parent_id)) t.parent_id = null;
    }
  const documents = owned("documents")
    .filter((d) => isAdmin || d.visible)
    .map((d) => ({ ...d, content: JSON.parse(d.content) }));
  if (!isAdmin)
    for (const d of documents)
      if (!documents.some((p) => p.id === d.parent_id)) d.parent_id = null;
  const taskIds = new Set(tasks.map((t) => t.id));
  const comments = sql
    .prepare(
      "SELECT c.*,u.name author FROM comments c JOIN users u ON u.id=c.user_id ORDER BY c.created_at",
    )
    .all()
    .filter((c) => taskIds.has(c.task_id) && (isAdmin || c.visible));
  const approvals = owned("approvals").map((a) => ({
    ...a,
    decision_name: a.decision_by
      ? sql.prepare("SELECT name FROM users WHERE id=?").get(a.decision_by)
          ?.name
      : null,
  }));
  const attachments = sql
    .prepare("SELECT * FROM attachments")
    .all()
    .filter((a) => taskIds.has(a.task_id) && (isAdmin || a.visible));
  return {
    user,
    phases,
    projects,
    tasks,
    documents,
    comments,
    attachments,
    approvals,
    resources: owned("resources").filter((r) => isAdmin || r.visible),
    customers: sql
      .prepare(`SELECT * FROM customers ${isAdmin ? "" : "WHERE id=?"}`)
      .all(...(isAdmin ? [] : [user.customer_id])),
    users: isAdmin
      ? sql.prepare("SELECT id,name,email,role,customer_id FROM users").all()
      : [],
    time_entries: isAdmin ? owned("time_entries") : [],
  };
}
export async function handle(request) {
  try {
    const path = new URL(request.url).pathname
      .replace(/^\/api\//, "")
      .replace(/\/$/, "");
    const [resource, id, action] = path.split("/");
    const method = request.method,
      sql = db();
    if (method !== "GET") {
      const origin = request.headers.get("origin");
      const expected = new URL(process.env.APP_URL || "http://localhost:3000")
        .origin;
      if (origin !== expected)
        fail("Ungültiger Ursprung / Invalid origin", 403);
      if (Number(request.headers.get("content-length") || 0) > 600000)
        fail("Request too large", 413);
    }
    let body = {};
    if (["POST", "PATCH"].includes(method)) {
      const raw = await request.text();
      if (raw.length > 600000) fail("Request too large", 413);
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        fail("Ungültiges JSON / Invalid JSON");
      }
      if (!body || Array.isArray(body) || typeof body !== "object")
        fail("Invalid body");
    }
    if (path === "health" && method === "GET") return json({ ok: true });
    if (path === "auth/login" && method === "POST") {
      const email = str(body.email, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail("Ungültige E-Mail / Invalid email");
      const token = issueLogin(email);
      if (token)
        try {
          await sendLogin(email, token);
        } catch (error) {
          console.error("Mail delivery failed:", error.message);
          sql.prepare("DELETE FROM auth_tokens WHERE hash=?").run(hash(token));
        }
      return json({
        message:
          "Falls deine Adresse freigeschaltet ist, erhältst du einen Anmeldelink. / If your address is enabled, you will receive a sign-in link.",
      });
    }
    if (path === "auth/verify" && method === "POST") {
      const userId = redeemLogin(str(body.token, 100));
      if (!userId)
        fail(
          "Link abgelaufen oder bereits verwendet / Link expired or already used",
          401,
        );
      return json({ ok: true }, 200, {
        "Set-Cookie": sessionCookie(createSession(userId)),
      });
    }
    const user = currentUser(request);
    if (!user) fail("Bitte anmelden / Sign in required", 401);
    if (path === "auth/logout" && method === "POST") {
      const cookie = (request.headers.get("cookie") || "")
        .split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("ops_session="))
        ?.slice(12);
      if (cookie)
        sql.prepare("DELETE FROM sessions WHERE hash=?").run(hash(cookie));
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", true) });
    }
    if (path === "state" && method === "GET") return json(state(user));
    if (resource === "approvals" && id && method === "PATCH") {
      const a = entity(user, "approvals", id);
      if (user.role !== "customer")
        fail("Kundenfreigabe erforderlich / Customer decision required", 403);
      if (
        !["approved", "changes"].includes(body.status) ||
        a.status !== "pending"
      )
        fail("Freigabe bereits entschieden / Already decided", 409);
      sql
        .prepare(
          "UPDATE approvals SET status=?,decision_by=?,decision_at=?,feedback=? WHERE id=?",
        )
        .run(
          body.status,
          user.id,
          new Date().toISOString(),
          text(body.feedback),
          id,
        );
      return json({ ok: true });
    }
    if (resource === "comments" && method === "POST") {
      const task = entity(user, "tasks", required(str(body.task_id)));
      sql
        .prepare(
          "INSERT INTO comments(id,task_id,user_id,body,visible) VALUES(?,?,?,?,?)",
        )
        .run(
          uid(),
          task.id,
          user.id,
          required(text(body.body)),
          user.role === "customer" ? 1 : bool(body.visible),
        );
      return json({ ok: true }, 201);
    }
    admin(user);
    if (resource === "attachments" && method === "POST") {
      const task = entity(user, "tasks", required(str(body.task_id))),
        id = uid();
      sql
        .prepare("INSERT INTO attachments VALUES(?,?,?,?,?)")
        .run(
          id,
          task.id,
          required(str(body.title)),
          url(body.url),
          bool(body.visible),
        );
      return json({ id }, 201);
    }
    if (resource === "customers" && method === "POST") {
      const id = uid(),
        name = required(str(body.name));
      sql
        .prepare(
          "INSERT INTO customers(id,name,initials,color,logo) VALUES(?,?,?,?,?)",
        )
        .run(
          id,
          name,
          name
            .split(/\s+/)
            .map((x) => x[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          str(body.color) || "#e9e1f5",
          body.logo ? url(body.logo) : "",
        );
      return json({ id }, 201);
    }
    if (resource === "users" && method === "POST") {
      const email = required(str(body.email, 254)).toLowerCase(),
        role = body.role === "admin" ? "admin" : "customer";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Invalid email");
      const customerId =
        role === "customer" ? required(str(body.customer_id)) : null;
      if (
        customerId &&
        !sql.prepare("SELECT id FROM customers WHERE id=?").get(customerId)
      )
        fail("Kunde fehlt");
      const id = uid();
      sql
        .prepare(
          "INSERT INTO users(id,email,name,role,customer_id) VALUES(?,?,?,?,?)",
        )
        .run(id, email, required(str(body.name)), role, customerId);
      return json({ id }, 201);
    }
    if (resource === "users" && id && method === "DELETE") {
      const target = sql.prepare("SELECT * FROM users WHERE id=?").get(id);
      if (!target) fail("Not found", 404);
      if (target.role === "admin")
        fail(
          "Admin kann hier nicht entfernt werden / Cannot remove admin",
          403,
        );
      sql.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
      sql.prepare("DELETE FROM auth_tokens WHERE user_id=?").run(id);
      // Keep the historical author identity while immediately revoking customer access.
      sql.prepare("UPDATE users SET customer_id=NULL WHERE id=?").run(id);
      return json({ ok: true });
    }
    if (resource === "projects" && method === "POST") {
      const c = required(str(body.customer_id));
      if (!sql.prepare("SELECT id FROM customers WHERE id=?").get(c))
        fail("Kunde fehlt");
      const id = uid(),
        start = date(body.start_date) || new Date().toISOString().slice(0, 10),
        due = required(date(body.due_date));
      if (due < start) fail("Enddatum liegt vor Start / End precedes start");
      sql.exec("BEGIN");
      try {
        sql
          .prepare(
            "INSERT INTO projects(id,customer_id,name,description,phase,start_date,due_date,budget,hours_budget,pricing) VALUES(?,?,?,?,?,?,?,?,?,?)",
          )
          .run(
            id,
            c,
            required(str(body.name)),
            text(body.description),
            "Kick-off",
            start,
            due,
            number(body.budget || 0),
            number(body.hours_budget || 0),
            body.pricing === "hourly" ? "hourly" : "fixed",
          );
        if (body.template !== false)
          phases.forEach((title, i) =>
            sql
              .prepare(
                "INSERT INTO tasks(id,project_id,title,start_date,due_date) VALUES(?,?,?,?,?)",
              )
              .run(uid(), id, title, start, due),
          );
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
      return json({ id }, 201);
    }
    if (resource === "projects" && id && method === "PATCH") {
      const p = projectAccess(user, id),
        phase = body.phase || p.phase;
      if (!phases.includes(phase)) fail("Invalid phase");
      sql
        .prepare("UPDATE projects SET phase=?,name=? WHERE id=?")
        .run(phase, body.name ? str(body.name) : p.name, id);
      return json({ ok: true });
    }
    if (resource === "tasks" && method === "POST") {
      const p = projectAccess(user, required(str(body.project_id))),
        parent = body.parent_id ? entity(user, "tasks", body.parent_id) : null;
      if (parent && parent.project_id !== p.id) fail("Invalid parent");
      const assignee = body.assignee_id || null;
      if (
        assignee &&
        !sql
          .prepare("SELECT id FROM users WHERE id=? AND role='admin'")
          .get(assignee)
      )
        fail("Invalid assignee");
      if (body.recurrence && !["weekly", "monthly"].includes(body.recurrence))
        fail("Invalid recurrence");
      if (!["low", "medium", "high"].includes(body.priority || "medium"))
        fail("Invalid priority");
      const id = uid();
      sql
        .prepare(
          "INSERT INTO tasks(id,project_id,parent_id,title,description,priority,assignee_id,start_date,due_date,visible,recurrence) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          p.id,
          parent?.id || null,
          required(str(body.title)),
          text(body.description),
          body.priority || "medium",
          assignee,
          date(body.start_date),
          date(body.due_date),
          bool(body.visible),
          body.recurrence || "",
        );
      return json({ id }, 201);
    }
    if (resource === "tasks" && id && method === "PATCH") {
      const t = entity(user, "tasks", id),
        status = body.status || t.status;
      if (!["todo", "progress", "review", "done"].includes(status))
        fail("Invalid status");
      const assignee =
        body.assignee_id === undefined
          ? t.assignee_id
          : body.assignee_id || null;
      if (
        assignee &&
        !sql
          .prepare("SELECT id FROM users WHERE id=? AND role='admin'")
          .get(assignee)
      )
        fail("Invalid assignee");
      const due =
        body.due_date === undefined ? t.due_date : date(body.due_date);
      sql.exec("BEGIN");
      try {
        sql
          .prepare(
            "UPDATE tasks SET title=?,status=?,assignee_id=?,due_date=?,visible=? WHERE id=?",
          )
          .run(
            body.title ? str(body.title) : t.title,
            status,
            assignee,
            due,
            body.visible === undefined ? t.visible : bool(body.visible),
            id,
          );
        if (
          t.status !== "done" &&
          status === "done" &&
          t.recurrence &&
          t.due_date &&
          !sql
            .prepare("SELECT source_id FROM task_recurrences WHERE source_id=?")
            .get(t.id)
        ) {
          const next = new Date(`${t.due_date}T12:00:00Z`);
          if (t.recurrence === "weekly") next.setUTCDate(next.getUTCDate() + 7);
          else {
            const day = next.getUTCDate();
            next.setUTCDate(1);
            next.setUTCMonth(next.getUTCMonth() + 1);
            const last = new Date(
              Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
            ).getUTCDate();
            next.setUTCDate(Math.min(day, last));
          }
          const nextId = uid();
          sql
            .prepare(
              "INSERT INTO tasks(id,project_id,title,description,priority,assignee_id,due_date,visible,recurrence) VALUES(?,?,?,?,?,?,?,?,?)",
            )
            .run(
              nextId,
              t.project_id,
              t.title,
              t.description,
              t.priority,
              assignee,
              next.toISOString().slice(0, 10),
              t.visible,
              t.recurrence,
            );
          sql
            .prepare("INSERT INTO task_recurrences VALUES(?,?)")
            .run(t.id, nextId);
        }
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
      return json({ ok: true });
    }
    if (resource === "documents" && method === "POST") {
      const p = projectAccess(user, required(str(body.project_id))),
        parent = body.parent_id
          ? entity(user, "documents", body.parent_id)
          : null;
      if (parent && parent.project_id !== p.id) fail("Invalid parent");
      const id = uid();
      sql
        .prepare(
          "INSERT INTO documents(id,project_id,parent_id,title,content,visible,is_template) VALUES(?,?,?,?,?,?,?)",
        )
        .run(
          id,
          p.id,
          parent?.id || null,
          required(str(body.title)),
          docContent(
            body.content || { type: "doc", content: [{ type: "paragraph" }] },
          ),
          bool(body.visible),
          bool(body.is_template),
        );
      return json({ id }, 201);
    }
    if (resource === "documents" && id && method === "PATCH") {
      const d = entity(user, "documents", id);
      sql
        .prepare(
          "UPDATE documents SET title=?,content=?,visible=?,is_template=?,updated_at=? WHERE id=?",
        )
        .run(
          body.title ? str(body.title) : d.title,
          body.content ? docContent(body.content) : d.content,
          body.visible === undefined ? d.visible : bool(body.visible),
          body.is_template === undefined
            ? d.is_template
            : bool(body.is_template),
          new Date().toISOString(),
          id,
        );
      return json({ ok: true });
    }
    if (resource === "resources" && method === "POST") {
      const p = projectAccess(user, required(str(body.project_id))),
        id = uid();
      sql
        .prepare("INSERT INTO resources VALUES(?,?,?,?,?)")
        .run(
          id,
          p.id,
          required(str(body.title)),
          url(body.url),
          bool(body.visible),
        );
      return json({ id }, 201);
    }
    if (resource === "time" && method === "POST") {
      const p = projectAccess(user, required(str(body.project_id))),
        minutes = number(body.minutes, 1440);
      if (!Number.isInteger(minutes) || minutes < 1) fail("Invalid duration");
      const id = uid();
      sql
        .prepare("INSERT INTO time_entries VALUES(?,?,?,?,?,?)")
        .run(
          id,
          p.id,
          user.id,
          required(date(body.date)),
          minutes,
          text(body.note),
        );
      return json({ id }, 201);
    }
    if (resource === "approvals" && method === "POST") {
      const p = projectAccess(user, required(str(body.project_id))),
        id = uid();
      sql
        .prepare(
          "INSERT INTO approvals(id,project_id,title,reference) VALUES(?,?,?,?)",
        )
        .run(
          id,
          p.id,
          required(str(body.title)),
          required(str(body.reference, 2000)),
        );
      return json({ id }, 201);
    }
    fail("Nicht gefunden / Not found", 404);
  } catch (error) {
    if (error.status) return json({ error: error.message }, error.status);
    if (error.code?.includes("CONSTRAINT") || (error.errcode & 255) === 19)
      return json({ error: "Datenkonflikt / Data conflict" }, 409);
    console.error(error);
    return json({ error: "Serverfehler / Server error" }, 500);
  }
}
