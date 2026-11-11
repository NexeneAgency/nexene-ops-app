import { manageUser } from "./user-management.mjs";
import { deleteProject } from "./project-delete.mjs";
import { onboardingEmail, saveOnboarding } from "./onboarding-api.mjs";
import { defaultPhaseWeights, projectProgress } from "./project-phases.mjs";
import {
  MAX_REPORT_BYTES,
  REPORT_CHUNK_BYTES,
  readReportRequest,
} from "./report-storage.mjs";
import { database } from "./database.mjs";
import { applicationUrl } from "./config.mjs";
import { uid, phases } from "./db.mjs";
import {
  currentUser,
  currentApiKey,
  generateApiKey,
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
async function projectAccess(user, id) {
  const p = await (
    await database()
  )
    .prepare("SELECT * FROM projects WHERE id=?")
    .get(id);
  if (!p || (user.role !== "admin" && p.customer_id !== user.customer_id))
    fail("Nicht gefunden / Not found", 404);
  return p;
}
async function entity(user, table, id) {
  const row = await (
    await database()
  )
    .prepare(`SELECT * FROM ${table} WHERE id=?`)
    .get(id);
  if (!row) fail("Nicht gefunden / Not found", 404);
  await projectAccess(user, row.project_id);
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
          fail(
            "Diese Formatierung wird nicht unterstützt. / This formatting is not supported.",
          );
        if (mark.type === "link") url(mark.attrs?.href);
      }
    if (node.content) {
      if (!Array.isArray(node.content))
        fail(
          "Der Dokumentinhalt ist ungültig. / The document content is invalid.",
        );
      for (const child of node.content) check(child, depth + 1);
    }
  };
  check(value);
  return s;
}
function phaseWeights(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== phases.length ||
    phases.some(
      (phase) =>
        typeof value[phase] !== "number" ||
        !Number.isInteger(value[phase]) ||
        value[phase] < 0 ||
        value[phase] > 100,
    ) ||
    Object.values(value).reduce((sum, weight) => sum + weight, 0) !== 100
  )
    fail(
      "Die Phasenanteile müssen zusammen 100 % ergeben. / Phase shares must total 100%.",
    );
  return Object.fromEntries(phases.map((phase) => [phase, value[phase]]));
}
async function state(user) {
  const sql = await database(),
    isAdmin = user.role === "admin";
  const projects = await sql
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
  const owned = async (table) =>
    (await sql.prepare(`SELECT * FROM ${table}`).all()).filter((row) =>
      ids.has(row.project_id),
    );
  const allTasks = await owned("tasks");
  for (const p of projects) {
    p.phase_weights = JSON.parse(p.phase_weights);
    p.progress =
      p.project_type === "seo_geo"
        ? null
        : projectProgress(
            allTasks.filter((task) => task.project_id === p.id),
            p.phase_weights,
          );
  }
  const tasks = allTasks.filter((t) => isAdmin || t.visible);
  if (!isAdmin)
    for (const t of tasks) {
      delete t.assignee_id;
      if (!tasks.some((p) => p.id === t.parent_id)) t.parent_id = null;
    }
  const documents = (await owned("documents"))
    .filter((d) => isAdmin || d.visible)
    .map((d) => ({ ...d, content: JSON.parse(d.content) }));
  if (!isAdmin)
    for (const d of documents)
      if (!documents.some((p) => p.id === d.parent_id)) d.parent_id = null;
  const taskIds = new Set(tasks.map((t) => t.id));
  const comments = (
    await sql
      .prepare(
        "SELECT c.*,u.name author FROM comments c JOIN users u ON u.id=c.user_id ORDER BY c.created_at",
      )
      .all()
  ).filter((c) => taskIds.has(c.task_id) && (isAdmin || c.visible));
  const approvals = [];
  for (const a of await owned("approvals")) {
    approvals.push({
      ...a,
      decision_name: a.decision_by
        ? (
            await sql
              .prepare("SELECT name FROM users WHERE id=?")
              .get(a.decision_by)
          )?.name
        : null,
    });
  }
  const attachments = (
    await sql.prepare("SELECT * FROM attachments").all()
  ).filter((a) => taskIds.has(a.task_id) && (isAdmin || a.visible));
  return {
    user,
    phases,
    projects,
    tasks,
    documents,
    comments,
    attachments,
    approvals,
    reports: await owned("reports"),
    onboarding_email: onboardingEmail(),
    onboardings: (await owned("onboardings")).map((row) => ({
      ...row,
      answers: JSON.parse(row.answers),
    })),
    resources: (await owned("resources")).filter((r) => isAdmin || r.visible),
    customers: await sql
      .prepare(`SELECT * FROM customers ${isAdmin ? "" : "WHERE id=?"}`)
      .all(...(isAdmin ? [] : [user.customer_id])),
    users: isAdmin
      ? await sql
          .prepare(
            "SELECT id,name,email,role,customer_id,last_login_at,login_state,revision FROM users WHERE deleted_at IS NULL",
          )
          .all()
      : [],
    time_entries: isAdmin
      ? (
          await sql
            .prepare(
              "SELECT e.*,u.name user_name FROM time_entries e JOIN users u ON u.id=e.user_id",
            )
            .all()
        ).filter((row) => ids.has(row.project_id))
      : [],
  };
}
export async function handle(request) {
  try {
    const path = new URL(request.url).pathname
      .replace(/^\/api\//, "")
      .replace(/\/$/, "");
    const [resource, id, action] = path.split("/");
    const method = request.method,
      sql = await database();
    const reportUpload = resource === "reports" && !id && method === "POST";
    const apiKeyUser = await currentApiKey(request);
    if (method !== "GET") {
      if (!apiKeyUser) {
        const origin = request.headers.get("origin");
        const expected = applicationUrl();
        if (origin !== expected)
          fail("Ungültiger Ursprung / Invalid origin", 403);
      }
      if (
        !reportUpload &&
        Number(request.headers.get("content-length") || 0) > 600000
      )
        fail(
          "Die Anfrage ist zu groß. Bitte reduziere den Inhalt. / The request is too large. Reduce the content.",
          413,
        );
    }
    let body = {};
    if (!reportUpload && ["POST", "PATCH"].includes(method)) {
      const raw = await request.text();
      if (raw.length > 600000)
        fail(
          "Die Anfrage ist zu groß. Bitte reduziere den Inhalt. / The request is too large. Reduce the content.",
          413,
        );
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        fail("Ungültiges JSON / Invalid JSON");
      }
      if (!body || Array.isArray(body) || typeof body !== "object")
        fail(
          "Die Anfrage enthält ungültige Daten. Bitte prüfe deine Eingaben. / The request contains invalid data. Check your input.",
        );
    }
    if (path === "health" && method === "GET") return json({ ok: true });
    if (path === "auth/login" && method === "POST") {
      const email = str(body.email, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail("Ungültige E-Mail / Invalid email");
      const token = await issueLogin(email);
      if (token)
        try {
          await sendLogin(email, token);
        } catch (error) {
          console.error("Mail delivery failed:", error.message);
          await sql
            .prepare("DELETE FROM auth_tokens WHERE hash=?")
            .run(hash(token));
        }
      return json({
        message:
          "Falls deine Adresse freigeschaltet ist, erhältst du einen Anmeldelink. / If your address is enabled, you will receive a sign-in link.",
      });
    }
    if (path === "auth/verify" && method === "POST") {
      const userId = await redeemLogin(str(body.token, 100));
      if (!userId)
        fail(
          "Link abgelaufen oder bereits verwendet / Link expired or already used",
          401,
        );
      return json({ ok: true }, 200, {
        "Set-Cookie": sessionCookie(await createSession(userId)),
      });
    }
    const user = apiKeyUser ?? (await currentUser(request));
    if (!user) fail("Bitte anmelden / Sign in required", 401);
    if (path === "auth/logout" && method === "POST") {
      const cookie = (request.headers.get("cookie") || "")
        .split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("ops_session="))
        ?.slice(12);
      if (cookie)
        await sql
          .prepare("DELETE FROM sessions WHERE hash=?")
          .run(hash(cookie));
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", true) });
    }
    if (path === "state" && method === "GET") return json(await state(user));
    if (
      resource === "reports" &&
      id &&
      action === "download" &&
      method === "GET"
    ) {
      const report = await sql
        .prepare("SELECT * FROM reports WHERE id=?")
        .get(id);
      if (!report) fail("Nicht gefunden / Not found", 404);
      await projectAccess(user, report.project_id);
      const chunks = await sql
        .prepare(
          "SELECT content FROM report_chunks WHERE report_id=? ORDER BY position",
        )
        .all(id);
      const pdf = Buffer.concat(
        chunks.map((chunk) => Buffer.from(chunk.content)),
      );
      if (pdf.length !== report.size)
        throw new Error("Incomplete report storage");
      const fallback = report.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
      return new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(pdf.length),
          "Content-Disposition": `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(report.file_name).replace(/['()*]/g, (char) => "%" + char.charCodeAt(0).toString(16))}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "sandbox; default-src 'none'",
        },
      });
    }
    if (resource === "onboardings" && id && !action && method === "PATCH") {
      const project = await projectAccess(user, id);
      return json(await saveOnboarding(sql, user, project, body));
    }
    if (resource === "reports") {
      admin(user);
      if (reportUpload) {
        if (
          !request.headers
            .get("content-type")
            ?.startsWith("multipart/form-data;")
        )
          fail("Bitte eine PDF-Datei hochladen. / Upload a PDF file.");
        let form;
        try {
          form = await readReportRequest(request);
        } catch (error) {
          if (error.status) throw error;
          fail("Upload ungültig / Invalid upload");
        }
        const project = await projectAccess(
          user,
          required(str(form.get("project_id"))),
        );
        if (project.project_type !== "seo_geo")
          fail(
            "Reports gehören zu SEO + GEO Projekten. / Reports require an SEO + GEO project.",
          );
        const file = form.get("file"),
          period = str(form.get("period"));
        const title = required(str(form.get("title"))),
          description = text(form.get("description"));
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
          fail("Bitte einen Berichtsmonat wählen. / Select a report month.");
        if (
          !file ||
          typeof file.arrayBuffer !== "function" ||
          !file.size ||
          !/\.pdf$/i.test(file.name) ||
          !["application/pdf", ""].includes(file.type)
        )
          fail("Bitte eine PDF-Datei wählen. / Select a PDF file.");
        if (file.size > MAX_REPORT_BYTES)
          fail(
            "PDF zu groß. Maximal 3 MB. / PDF too large. Maximum 3 MB.",
            413,
          );
        const pdf = Buffer.from(await file.arrayBuffer());
        if (
          !/^%PDF-(1\.[0-7]|2\.0)/.test(
            pdf.subarray(0, 16).toString("ascii"),
          ) ||
          !pdf.subarray(-2048).includes(Buffer.from("%%EOF"))
        )
          fail(
            "Die Datei ist keine gültige PDF. / The file is not a valid PDF.",
          );
        const id = uid(),
          fileName =
            file.name
              .replace(/[\/\\\x00-\x1f\x7f]/g, "_")
              .slice(0, 180)
              .replace(/\.pdf$/i, "") + ".pdf";
        await sql.transaction(async (tx) => {
          await tx
            .prepare(
              "INSERT INTO reports(id,project_id,title,period,description,file_name,size) VALUES(?,?,?,?,?,?,?)",
            )
            .run(
              id,
              project.id,
              title,
              period,
              description,
              fileName,
              pdf.length,
            );
          for (
            let offset = 0;
            offset < pdf.length;
            offset += REPORT_CHUNK_BYTES
          )
            await tx
              .prepare(
                "INSERT INTO report_chunks(report_id,position,content) VALUES(?,?,?)",
              )
              .run(
                id,
                offset / REPORT_CHUNK_BYTES,
                pdf.subarray(offset, offset + REPORT_CHUNK_BYTES),
              );
        });
        return json({ id }, 201);
      }
      if (id && !action && method === "DELETE") {
        const report = await entity(user, "reports", id);
        await sql.prepare("DELETE FROM reports WHERE id=?").run(report.id);
        return json({ ok: true });
      }
      fail("Nicht gefunden / Not found", 404);
    }
    if (resource === "approvals" && id && method === "PATCH") {
      const a = await entity(user, "approvals", id);
      if (user.role !== "customer")
        fail("Kundenfreigabe erforderlich / Customer decision required", 403);
      if (
        !["approved", "changes"].includes(body.status) ||
        a.status !== "pending"
      )
        fail("Freigabe bereits entschieden / Already decided", 409);
      const decision = await sql
        .prepare(
          "UPDATE approvals SET status=?,decision_by=?,decision_at=?,feedback=? WHERE id=? AND status='pending'",
        )
        .run(
          body.status,
          user.id,
          new Date().toISOString(),
          text(body.feedback),
          id,
        );
      if (decision.changes !== 1)
        fail("Freigabe bereits entschieden / Already decided", 409);
      return json({ ok: true });
    }
    if (resource === "comments" && method === "POST") {
      const task = await entity(user, "tasks", required(str(body.task_id)));
      await sql
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
      const task = await entity(user, "tasks", required(str(body.task_id))),
        id = uid();
      await sql
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
      await sql
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
    if (resource === "users" && method === "POST")
      return json(await manageUser(sql, user, null, "POST", body), 201);
    if (resource === "users" && id && ["PATCH", "DELETE"].includes(method))
      return json(await manageUser(sql, user, id, method, body));
    if (resource === "projects" && method === "POST") {
      const newCustomer = body.new_customer;
      if (
        newCustomer !== undefined &&
        (!newCustomer ||
          typeof newCustomer !== "object" ||
          Array.isArray(newCustomer))
      )
        fail("Kundendaten ungültig / Invalid customer details");
      if (newCustomer && body.customer_id)
        fail(
          "Bitte einen Kunden auswählen oder neu anlegen. / Select or create one customer.",
        );
      const c = newCustomer ? uid() : required(str(body.customer_id));
      const customerName = newCustomer ? required(str(newCustomer.name)) : "";
      const customerLogo = newCustomer?.logo ? url(newCustomer.logo) : "";
      if (
        !newCustomer &&
        !(await sql.prepare("SELECT id FROM customers WHERE id=?").get(c))
      )
        fail("Kunde fehlt / Customer not found");
      const weights = phaseWeights(body.phase_weights ?? defaultPhaseWeights);
      const projectType = body.project_type ?? "web";
      if (!["web", "seo_geo"].includes(projectType))
        fail("Ungültiger Projekttyp / Invalid project type");
      const id = uid(),
        start = date(body.start_date) || new Date().toISOString().slice(0, 10),
        due =
          projectType === "seo_geo"
            ? date(body.due_date)
            : required(date(body.due_date));
      if (due && due < start)
        fail("Enddatum liegt vor Start / End precedes start");
      await sql.transaction(async (tx) => {
        if (newCustomer)
          await tx
            .prepare(
              "INSERT INTO customers(id,name,initials,color,logo) VALUES(?,?,?,?,?)",
            )
            .run(
              c,
              customerName,
              customerName
                .split(/\s+/)
                .map((x) => x[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              "#F8F1F1",
              customerLogo,
            );
        await tx
          .prepare(
            "INSERT INTO projects(id,customer_id,name,description,phase,start_date,due_date,budget,hours_budget,pricing,phase_weights,project_type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
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
            JSON.stringify(weights),
            projectType,
          );
        if (body.template !== false && projectType === "web") {
          for (const title of phases) {
            await tx
              .prepare(
                "INSERT INTO tasks(id,project_id,title,start_date,due_date,phase) VALUES(?,?,?,?,?,?)",
              )
              .run(uid(), id, title, start, due, title);
          }
        }
      });
      return json({ id }, 201);
    }
    if (resource === "projects" && id && method === "DELETE") {
      const project = await projectAccess(user, id);
      return json(await deleteProject(sql, project.id));
    }
    if (resource === "projects" && id && method === "PATCH") {
      const p = await projectAccess(user, id),
        phase = body.phase || p.phase;
      if (!phases.includes(phase))
        fail(
          "Bitte wähle eine vorhandene Projektphase. / Select an existing project phase.",
        );
      const projectType = body.project_type ?? p.project_type;
      if (!["web", "seo_geo"].includes(projectType))
        fail("Ungültiger Projekttyp / Invalid project type");
      const weights =
        body.phase_weights === undefined
          ? p.phase_weights
          : JSON.stringify(phaseWeights(body.phase_weights));
      await sql
        .prepare(
          "UPDATE projects SET phase=?,name=?,phase_weights=?,project_type=? WHERE id=?",
        )
        .run(
          phase,
          body.name ? str(body.name) : p.name,
          weights,
          projectType,
          id,
        );
      return json({ ok: true });
    }
    if (resource === "tasks" && method === "POST") {
      const p = await projectAccess(user, required(str(body.project_id))),
        parent = body.parent_id
          ? await entity(user, "tasks", body.parent_id)
          : null;
      if (parent && parent.project_id !== p.id)
        fail(
          "Die übergeordnete Aufgabe oder Seite muss zum selben Projekt gehören. / The parent task or page must belong to the same project.",
        );
      const assignee = body.assignee_id || null;
      if (
        assignee &&
        !(await sql
          .prepare(
            "SELECT id FROM users WHERE id=? AND role='admin' AND deleted_at IS NULL",
          )
          .get(assignee))
      )
        fail(
          "Bitte wähle ein freigeschaltetes Teammitglied. / Select an enabled team member.",
        );
      if (body.recurrence && !["weekly", "monthly"].includes(body.recurrence))
        fail(
          "Bitte wähle wöchentlich, monatlich oder keine Wiederholung. / Choose weekly, monthly or no recurrence.",
        );
      if (!["low", "medium", "high"].includes(body.priority || "medium"))
        fail(
          "Bitte wähle eine vorhandene Priorität. / Select an existing priority.",
        );
      const id = uid();
      const taskPhase = parent?.phase || body.phase || p.phase;
      if (!phases.includes(taskPhase))
        fail("Ungültige Projektphase / Invalid project phase");
      await sql
        .prepare(
          "INSERT INTO tasks(id,project_id,parent_id,title,description,priority,assignee_id,start_date,due_date,visible,recurrence,phase) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
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
          taskPhase,
        );
      return json({ id }, 201);
    }
    if (resource === "tasks" && id && method === "PATCH") {
      const t = await entity(user, "tasks", id),
        status = body.status || t.status;
      if (!["todo", "progress", "review", "done"].includes(status))
        fail(
          "Bitte wähle einen vorhandenen Aufgabenstatus. / Select an existing task status.",
        );
      const assignee =
        body.assignee_id === undefined
          ? t.assignee_id
          : body.assignee_id || null;
      if (
        assignee &&
        !(await sql
          .prepare(
            "SELECT id FROM users WHERE id=? AND role='admin' AND deleted_at IS NULL",
          )
          .get(assignee))
      )
        fail(
          "Bitte wähle ein freigeschaltetes Teammitglied. / Select an enabled team member.",
        );
      const taskPhase = body.phase ?? t.phase;
      if (!phases.includes(taskPhase))
        fail("Ungültige Projektphase / Invalid project phase");
      if (t.parent_id && body.phase !== undefined)
        fail(
          "Die Phase wird durch die Hauptaufgabe festgelegt. / The parent task sets the phase.",
        );
      const due =
        body.due_date === undefined ? t.due_date : date(body.due_date);
      await sql.transaction(async (tx) => {
        await tx
          .prepare(
            "UPDATE tasks SET title=?,status=?,assignee_id=?,due_date=?,visible=?,phase=? WHERE id=?",
          )
          .run(
            body.title ? str(body.title) : t.title,
            status,
            assignee,
            due,
            body.visible === undefined ? t.visible : bool(body.visible),
            taskPhase,
            id,
          );
        if (body.phase !== undefined)
          await tx
            .prepare(
              "WITH RECURSIVE descendants(id) AS (SELECT id FROM tasks WHERE parent_id=? UNION ALL SELECT child.id FROM tasks child JOIN descendants d ON child.parent_id=d.id) UPDATE tasks SET phase=? WHERE id IN (SELECT id FROM descendants)",
            )
            .run(id, taskPhase);
        if (
          t.status !== "done" &&
          status === "done" &&
          t.recurrence &&
          t.due_date &&
          !(await tx
            .prepare("SELECT source_id FROM task_recurrences WHERE source_id=?")
            .get(t.id))
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
          await tx
            .prepare(
              "INSERT INTO tasks(id,project_id,title,description,priority,assignee_id,due_date,visible,recurrence,phase) VALUES(?,?,?,?,?,?,?,?,?,?)",
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
              taskPhase,
            );
          await tx
            .prepare("INSERT INTO task_recurrences VALUES(?,?)")
            .run(t.id, nextId);
        }
      });
      return json({ ok: true });
    }
    if (resource === "documents" && method === "POST") {
      const p = await projectAccess(user, required(str(body.project_id))),
        parent = body.parent_id
          ? await entity(user, "documents", body.parent_id)
          : null;
      if (parent && parent.project_id !== p.id)
        fail(
          "Die übergeordnete Aufgabe oder Seite muss zum selben Projekt gehören. / The parent task or page must belong to the same project.",
        );
      const id = uid();
      await sql
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
    if (resource === "documents" && id && method === "DELETE") {
      const d = await entity(user, "documents", id);
      await sql.prepare("DELETE FROM documents WHERE id=?").run(d.id);
      return json({ ok: true });
    }
    if (resource === "documents" && id && method === "PATCH") {
      const d = await entity(user, "documents", id);
      if (
        !Number.isInteger(body.expected_revision) ||
        body.expected_revision < 1
      )
        fail(
          "Dokumentstand fehlt. Bitte neu laden. / Document revision required. Please reload.",
          428,
        );
      const result = await sql
        .prepare(
          "UPDATE documents SET title=?,content=?,visible=?,is_template=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=?",
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
          body.expected_revision,
        );
      if (result.changes === 0)
        fail(
          "Eine andere Person hat diese Seite geändert. Dein Entwurf bleibt erhalten. Bitte den aktuellen Stand laden und Änderungen zusammenführen. / Someone else changed this page. Your draft is preserved. Load the latest version and reconcile your changes.",
          409,
        );
      return json({ ok: true, revision: body.expected_revision + 1 });
    }
    if (resource === "resources" && method === "POST") {
      const p = await projectAccess(user, required(str(body.project_id))),
        id = uid();
      await sql
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
      const p = await projectAccess(user, required(str(body.project_id))),
        minutes = number(body.minutes, 1440);
      if (!Number.isInteger(minutes) || minutes < 1)
        fail(
          "Bitte gib mindestens eine volle Minute ein. / Enter at least one whole minute.",
        );
      const id = uid();
      await sql
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
      const p = await projectAccess(user, required(str(body.project_id))),
        id = uid();
      await sql
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
    if (resource === "agent-keys") {
      admin(user);
      if (method === "GET") {
        const keys = await sql
          .prepare(
            "SELECT id, name, created_at, last_used_at FROM api_keys ORDER BY created_at DESC",
          )
          .all();
        return json(keys);
      }
      if (method === "POST" && !id) {
        if (apiKeyUser)
          fail(
            "API-Schlüssel können nur per Browser-Session erstellt werden. / API keys require a browser session.",
            403,
          );
        const token = generateApiKey();
        const keyId = uid();
        await sql
          .prepare("INSERT INTO api_keys(id,name,key_hash) VALUES(?,?,?)")
          .run(keyId, required(str(body.name)), hash(token));
        return json({ id: keyId, token: `nxops_${token}` }, 201);
      }
      if (id && method === "DELETE") {
        if (apiKeyUser)
          fail(
            "API-Schlüssel können nur per Browser-Session gelöscht werden. / API keys require a browser session.",
            403,
          );
        await sql.prepare("DELETE FROM api_keys WHERE id=?").run(id);
        return json({ ok: true });
      }
    }
    fail("Nicht gefunden / Not found", 404);
  } catch (error) {
    if (error.status) return json({ error: error.message }, error.status);
    if (error.code?.includes("CONSTRAINT") || (error.errcode & 255) === 19)
      return json({ error: "Datenkonflikt / Data conflict" }, 409);
    console.error(error);
    return json(
      {
        error:
          "Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut. / The request failed. Please try again.",
      },
      500,
    );
  }
}
