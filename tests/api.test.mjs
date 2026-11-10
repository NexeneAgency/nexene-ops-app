import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
const temp = mkdtempSync(join(tmpdir(), "nexene-test-"));
process.env.DATA_DIR = temp;
if (process.env.OPS_TEST_DRIVER === "libsql")
  process.env.TURSO_DATABASE_URL = "file:" + join(temp, "ops.sqlite");
process.env.ADMIN_EMAILS = "admin@nexene.test";
process.env.APP_URL = "http://localhost:3000";
process.env.SEED_DEMO = "false";
const { closeDatabase } = await import("../lib/database.mjs");
const { handle } = await import("../lib/api.mjs");
const { db, uid, migrateDocuments } = await import("../lib/db.mjs");
const { createSession, issueLogin, redeemLogin } =
  await import("../lib/auth.mjs");
const sql = db(),
  admin = await sql.prepare("SELECT * FROM users WHERE role='admin'").get(),
  adminCookie = `ops_session=${await createSession(admin.id)}`;
async function call(
  path,
  method = "GET",
  body,
  cookie = adminCookie,
  origin = "http://localhost:3000",
) {
  const response = await handle(
    new Request(`http://localhost:3000/api/${path}`, {
      method,
      headers: { origin, cookie, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
  return { status: response.status, body: await response.json(), response };
}
let customerA,
  customerB,
  projectA,
  projectB,
  userA,
  userB,
  cookieA,
  cookieB,
  visibleTask,
  hiddenTask,
  document;
test("authentication is required, writes reject other origins", async () => {
  assert.equal((await call("state", "GET", null, "")).status, 401);
  assert.equal(
    (
      await call(
        "customers",
        "POST",
        { name: "Bad" },
        adminCookie,
        "https://evil.test",
      )
    ).status,
    403,
  );
});
test("create customers, projects and authorized contacts", async () => {
  customerA = (await call("customers", "POST", { name: "Customer A" })).body.id;
  customerB = (await call("customers", "POST", { name: "Customer B" })).body.id;
  projectA = (
    await call("projects", "POST", {
      customer_id: customerA,
      name: "Project A",
      start_date: "2026-11-01",
      due_date: "2026-12-01",
      budget: 9000,
      hours_budget: 80,
      template: false,
    })
  ).body.id;
  projectB = (
    await call("projects", "POST", {
      customer_id: customerB,
      name: "Project B",
      due_date: "2027-12-01",
      template: false,
    })
  ).body.id;
  userA = (
    await call("users", "POST", {
      name: "Contact A",
      email: "a@customer.test",
      customer_id: customerA,
    })
  ).body.id;
  userB = (
    await call("users", "POST", {
      name: "Contact B",
      email: "b@customer.test",
      customer_id: customerB,
    })
  ).body.id;
  assert.ok(projectA);
  assert.ok(projectB);
  assert.ok(userA);
  cookieA = `ops_session=${await createSession(userA)}`;
  cookieB = `ops_session=${await createSession(userB)}`;
  visibleTask = (
    await call("tasks", "POST", {
      project_id: projectA,
      title: "Visible task",
      visible: true,
    })
  ).body.id;
  hiddenTask = (
    await call("tasks", "POST", {
      project_id: projectA,
      title: "Internal task",
    })
  ).body.id;
  document = (
    await call("documents", "POST", {
      project_id: projectA,
      title: "Public brief",
      visible: true,
    })
  ).body.id;
  await call("documents", "POST", {
    project_id: projectA,
    title: "Internal strategy",
  });
  await call("resources", "POST", {
    project_id: projectA,
    title: "Internal link",
    url: "https://example.com",
  });
  await call("attachments", "POST", {
    task_id: visibleTask,
    title: "Internal attachment",
    url: "https://example.com",
  });
  await call("attachments", "POST", {
    task_id: visibleTask,
    title: "Public attachment",
    url: "https://example.com",
    visible: true,
  });
  await call("attachments", "POST", {
    task_id: hiddenTask,
    title: "Hidden task attachment",
    url: "https://example.com",
    visible: true,
  });
  await call("time", "POST", {
    project_id: projectA,
    date: "2026-11-06",
    minutes: 60,
    note: "Private work",
  });
});
test("customer data excludes other customers and all internal financial/content data", async () => {
  const result = await call("state", "GET", null, cookieA),
    state = result.body;
  assert.equal(result.status, 200);
  assert.equal(state.projects.length, 1);
  assert.equal(state.projects[0].id, projectA);
  assert.equal("budget" in state.projects[0], false);
  assert.equal("hours_budget" in state.projects[0], false);
  assert.equal("pricing" in state.projects[0], false);
  assert.deepEqual(state.time_entries, []);
  assert.deepEqual(state.users, []);
  assert.deepEqual(state.resources, []);
  assert.equal(state.attachments.length, 1);
  assert.equal(state.attachments[0].title, "Public attachment");
  assert.deepEqual(
    state.tasks.map((t) => t.id),
    [visibleTask],
  );
  assert.equal(state.documents.length, 1);
  assert.equal(JSON.stringify(state).includes("Internal strategy"), false);
  assert.equal(JSON.stringify(state).includes("Private work"), false);
  assert.equal(
    (await call(`tasks/${visibleTask}`, "PATCH", { status: "done" }, cookieA))
      .status,
    403,
  );
  assert.equal(
    (await call(`documents/${document}`, "PATCH", { visible: true }, cookieB))
      .status,
    403,
  );
});
test("direct requests cannot reach foreign or internal tasks", async () => {
  assert.equal(
    (
      await call(
        "comments",
        "POST",
        { task_id: visibleTask, body: "Attack" },
        cookieB,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        "comments",
        "POST",
        { task_id: hiddenTask, body: "Attack" },
        cookieA,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        "comments",
        "POST",
        { task_id: visibleTask, body: "Customer feedback", visible: false },
        cookieA,
      )
    ).status,
    201,
  );
  await call("comments", "POST", {
    task_id: visibleTask,
    body: "INTERNAL ONLY",
  });
  const result = (await call("state", "GET", null, cookieA)).body;
  assert.equal(result.comments.length, 1);
  assert.equal(result.comments[0].visible, 1);
  assert.equal(result.comments[0].body, "Customer feedback");
});
test("customer approvals are attributed and immutable; foreign customers cannot decide", async () => {
  const id = (
    await call("approvals", "POST", {
      project_id: projectA,
      title: "Design v1",
      reference: "Figma snapshot 2026-11-06",
    })
  ).body.id;
  assert.equal(
    (await call(`approvals/${id}`, "PATCH", { status: "approved" }, cookieB))
      .status,
    404,
  );
  assert.equal(
    (await call(`approvals/${id}`, "PATCH", { status: "approved" })).status,
    403,
  );
  assert.equal(
    (
      await call(
        `approvals/${id}`,
        "PATCH",
        { status: "approved", feedback: "Looks great" },
        cookieA,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(`approvals/${id}`, "PATCH", { status: "changes" }, cookieA))
      .status,
    409,
  );
  const row = await sql.prepare("SELECT * FROM approvals WHERE id=?").get(id);
  assert.equal(row.decision_by, userA);
  assert.ok(row.decision_at);
});
test("magic links are single-use, expiring and restricted to known addresses", async () => {
  assert.equal(await issueLogin("unknown@customer.test"), null);
  const token = await issueLogin("a@customer.test");
  assert.ok(token);
  assert.equal(await redeemLogin(token), userA);
  assert.equal(await redeemLogin(token), undefined);
  const expired = await issueLogin("a@customer.test");
  await sql.prepare("UPDATE auth_tokens SET expires=0").run();
  assert.equal(await redeemLogin(expired), undefined);
  for (let i = 0; i < 5; i++) await issueLogin("admin@nexene.test");
  assert.equal(await issueLogin("admin@nexene.test"), null);
});
test("weekly recurrence produces one next task, including after reopening", async () => {
  const id = (
    await call("tasks", "POST", {
      project_id: projectA,
      title: "Weekly report",
      due_date: "2026-11-06",
      recurrence: "weekly",
    })
  ).body.id;
  await call(`tasks/${id}`, "PATCH", { status: "done" });
  await call(`tasks/${id}`, "PATCH", { status: "todo" });
  await call(`tasks/${id}`, "PATCH", { status: "done" });
  const all = await sql
    .prepare("SELECT * FROM tasks WHERE title='Weekly report'")
    .all();
  assert.equal(all.length, 2);
  assert.ok(all.some((t) => t.due_date === "2026-11-13"));
});
test("monthly recurrence clamps month-end dates", async () => {
  const id = (
    await call("tasks", "POST", {
      project_id: projectA,
      title: "Monthly report",
      due_date: "2027-01-31",
      recurrence: "monthly",
    })
  ).body.id;
  await call(`tasks/${id}`, "PATCH", { status: "done" });
  assert.equal(
    (
      await sql
        .prepare(
          "SELECT due_date FROM tasks WHERE title='Monthly report' AND status='todo'",
        )
        .get()
    ).due_date,
    "2027-02-28",
  );
});
test("validates links, document links, dates and numeric values", async () => {
  assert.equal(
    (
      await call("users", "POST", {
        name: "Duplicate",
        email: "a@customer.test",
        customer_id: customerA,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("resources", "POST", {
        project_id: projectA,
        title: "XSS",
        url: "javascript:alert(1)",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("tasks", "POST", {
        project_id: projectA,
        title: "Bad date",
        due_date: "2026-02-30",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("time", "POST", {
        project_id: projectA,
        date: "2026-11-06",
        minutes: -1,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(`documents/${document}`, "PATCH", {
        expected_revision: 1,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Bad",
                  marks: [
                    { type: "link", attrs: { href: "javascript:alert(1)" } },
                  ],
                },
              ],
            },
          ],
        },
      })
    ).status,
    400,
  );
});
test("session revocation takes effect immediately and scoped data stays inaccessible", async () => {
  assert.equal((await call(`users/${userB}`, "DELETE")).status, 200);
  assert.equal((await call("state", "GET", null, cookieB)).status, 401);
  assert.equal(await issueLogin("b@customer.test"), null);
  await assert.rejects(createSession(userB), { status: 401 });
});
test("document revisions prevent one admin from overwriting another admin's changes", async () => {
  const second = (
    await call("users", "POST", {
      name: "Second Admin",
      email: "second@nexene.test",
      role: "admin",
    })
  ).body.id;
  const cookie = `ops_session=${await createSession(second)}`;
  const created = (
    await call("documents", "POST", {
      project_id: projectA,
      title: "Concurrent editing",
    })
  ).body.id;
  assert.equal(
    (
      await call(`documents/${created}`, "PATCH", {
        content: { type: "doc", content: [] },
      })
    ).status,
    428,
  );
  const first = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "First admin version" }],
      },
    ],
  };
  assert.equal(
    (
      await call(`documents/${created}`, "PATCH", {
        expected_revision: 1,
        content: first,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        `documents/${created}`,
        "PATCH",
        { expected_revision: 1, content: { type: "doc", content: [] } },
        cookie,
      )
    ).status,
    409,
  );
  const row = await sql
    .prepare("SELECT * FROM documents WHERE id=?")
    .get(created);
  assert.equal(row.revision, 2);
  assert.deepEqual(JSON.parse(row.content), first);
  assert.equal(
    (
      await call(
        `documents/${created}`,
        "PATCH",
        { expected_revision: 2, visible: true },
        cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(`documents/${created}`, "PATCH", {
        expected_revision: 2,
        visible: false,
      })
    ).status,
    409,
  );
});

test("SQLite online backup restores customers, projects and tasks into a clean database", async () => {
  const file = join(temp, "restore.sqlite");
  await backup(sql, file);
  const restored = new DatabaseSync(file);
  assert.equal(
    (await restored.prepare("PRAGMA integrity_check").get()).integrity_check,
    "ok",
  );
  assert.equal(
    (await restored.prepare("SELECT COUNT(*) count FROM customers").get())
      .count,
    2,
  );
  assert.equal(
    (
      await restored
        .prepare("SELECT name FROM projects WHERE id=?")
        .get(projectA)
    ).name,
    "Project A",
  );
  assert.ok(
    await restored.prepare("SELECT id FROM tasks WHERE id=?").get(visibleTask),
  );
  restored.close();
});
test("schema migration preserves existing documents and is repeatable", async () => {
  const directory = join(temp, "legacy");
  mkdirSync(directory);
  const file = join(directory, "ops.sqlite");
  await backup(sql, file);
  const legacy = new DatabaseSync(file);
  legacy.exec(
    "ALTER TABLE documents DROP COLUMN revision; DELETE FROM schema_migrations WHERE version=2;",
  );
  const before = await legacy
    .prepare("SELECT id,content FROM documents WHERE id=?")
    .get(document);
  legacy.close();
  const upgraded = new DatabaseSync(file);
  for (let i = 0; i < 2; i++) migrateDocuments(upgraded);
  const row = await upgraded
    .prepare("SELECT * FROM documents WHERE id=?")
    .get(document);
  assert.equal(row.content, before.content);
  assert.equal(row.revision, 1);
  assert.ok(
    await upgraded
      .prepare("SELECT version FROM schema_migrations WHERE version=2")
      .get(),
  );
  upgraded.close();
});

test("Vercel requires persistent remote storage and cannot fall back to a local file", async () => {
  const { databaseConfiguration } = await import("../lib/database.mjs");
  assert.throws(
    () => databaseConfiguration({ VERCEL: "1" }),
    /TURSO_DATABASE_URL/,
  );
  assert.throws(
    () =>
      databaseConfiguration({
        VERCEL: "1",
        TURSO_DATABASE_URL: "file:/tmp/ops.sqlite",
      }),
    /remote/,
  );
  assert.throws(
    () =>
      databaseConfiguration({
        VERCEL: "1",
        TURSO_DATABASE_URL: "libsql://example.turso.io",
      }),
    /TURSO_AUTH_TOKEN/,
  );
  assert.equal(
    databaseConfiguration({
      VERCEL: "1",
      TURSO_DATABASE_URL: "libsql://example.turso.io",
      TURSO_AUTH_TOKEN: "test",
    }).url,
    "libsql://example.turso.io",
  );
});

test("Vercel login and origin checks use trusted deployment URLs", async () => {
  const { applicationUrl } = await import("../lib/config.mjs");
  assert.equal(
    applicationUrl({
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "ops.example.com",
      VERCEL_URL: "build.vercel.app",
    }),
    "https://ops.example.com",
  );
  assert.equal(
    applicationUrl({
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_URL: "preview.vercel.app",
    }),
    "https://preview.vercel.app",
  );
  assert.equal(
    applicationUrl({ VERCEL: "1", APP_URL: "https://ops.nexene.test/" }),
    "https://ops.nexene.test",
  );
  assert.throws(
    () => applicationUrl({ VERCEL: "1", APP_URL: "http://ops.example.com" }),
    /HTTPS/,
  );
  assert.throws(
    () => applicationUrl({ APP_URL: "https://ops.example.com/path" }),
    /origin/,
  );
});

test("libSQL initialization is repeatable and stored data survives a new client", async () => {
  const { createClient } = await import("@libsql/client");
  const { SqlDatabase, initializeDatabase } =
    await import("../lib/database.mjs");
  const url = "file:" + join(temp, "fresh.sqlite");
  let storage = new SqlDatabase(createClient({ url }));
  await initializeDatabase(storage);
  await storage
    .prepare("INSERT INTO customers(id,name,initials) VALUES(?,?,?)")
    .run("fresh", "Persistent data", "PD");
  assert.equal(
    (await storage.prepare("PRAGMA foreign_keys").get()).foreign_keys,
    1,
  );
  storage.close();
  storage = new SqlDatabase(createClient({ url }));
  await initializeDatabase(storage);
  assert.equal(
    (
      await storage
        .prepare("SELECT name FROM customers WHERE id=?")
        .get("fresh")
    ).name,
    "Persistent data",
  );
  assert.equal(
    (
      await storage
        .prepare("SELECT version FROM schema_migrations WHERE version=2")
        .get()
    ).version,
    2,
  );
  const created = (
    await storage.prepare("PRAGMA table_info(documents)").all()
  ).find((column) => column.name === "revision");
  assert.ok(created);
  storage.close();
});

test("a failed transaction rolls back all writes", async () => {
  const { database } = await import("../lib/database.mjs");
  const storage = await database();
  await assert.rejects(
    storage.transaction(async (tx) => {
      await tx
        .prepare("INSERT INTO customers(id,name,initials) VALUES(?,?,?)")
        .run("rollback", "Must not persist", "NO");
      throw new Error("abort");
    }),
    /abort/,
  );
  assert.equal(
    sql.prepare("SELECT id FROM customers WHERE id=?").get("rollback"),
    undefined,
  );
});

test("simultaneous login requests obey the limit and a token redeems once", async () => {
  await call("users", "POST", {
    name: "Parallel Admin",
    email: "parallel@nexene.test",
    role: "admin",
  });
  const tokens = await Promise.all(
    Array.from({ length: 8 }, () => issueLogin("parallel@nexene.test")),
  );
  assert.equal(tokens.filter(Boolean).length, 5);
  const redemptions = await Promise.all([
    redeemLogin(tokens.find(Boolean)),
    redeemLogin(tokens.find(Boolean)),
  ]);
  assert.equal(redemptions.filter(Boolean).length, 1);
});

test("simultaneous customer approvals and document writes have a single winner", async () => {
  const approval = (
    await call("approvals", "POST", {
      project_id: projectA,
      title: "Concurrent approval",
      reference: "Version 1",
    })
  ).body.id;
  const decisions = await Promise.all([
    call(`approvals/${approval}`, "PATCH", { status: "approved" }, cookieA),
    call(`approvals/${approval}`, "PATCH", { status: "changes" }, cookieA),
  ]);
  assert.deepEqual(decisions.map((r) => r.status).sort(), [200, 409]);
  const page = (
    await call("documents", "POST", {
      project_id: projectA,
      title: "Concurrent page",
    })
  ).body.id;
  const updates = await Promise.all([
    call(`documents/${page}`, "PATCH", {
      expected_revision: 1,
      title: "First",
    }),
    call(`documents/${page}`, "PATCH", {
      expected_revision: 1,
      title: "Second",
    }),
  ]);
  assert.deepEqual(updates.map((r) => r.status).sort(), [200, 409]);
});

test("project templates create every task within the transaction", async () => {
  const result = await call("projects", "POST", {
    customer_id: customerA,
    name: "Template project",
    due_date: "2027-12-31",
  });
  assert.equal(result.status, 201);
  assert.equal(
    sql
      .prepare("SELECT COUNT(*) n FROM tasks WHERE project_id=?")
      .get(result.body.id).n,
    9,
  );
});

test("v1.1 project phase weights affect progress independently of task counts", async () => {
  const { phases, defaultPhaseWeights } =
    await import("../lib/project-phases.mjs");
  const created = await call("projects", "POST", {
    customer_id: customerA,
    name: "Weighted project",
    due_date: "2027-12-31",
  });
  assert.equal(created.status, 201);
  const id = created.body.id;
  const templateTasks = sql
    .prepare("SELECT * FROM tasks WHERE project_id=?")
    .all(id);
  assert.equal(templateTasks.length, 9);
  assert.deepEqual(
    templateTasks.map((t) => t.phase).sort(),
    [...phases].sort(),
  );
  const development = templateTasks.find((t) => t.phase === "Entwicklung");
  await call(`tasks/${development.id}`, "PATCH", { status: "done" });
  const projectState = async (cookie = adminCookie) =>
    (await call("state", "GET", null, cookie)).body.projects.find(
      (p) => p.id === id,
    );
  assert.equal((await projectState()).progress, 30);
  const weights = { ...defaultPhaseWeights, Entwicklung: 50, Design: 0 };
  assert.equal(
    (await call(`projects/${id}`, "PATCH", { phase_weights: weights })).status,
    200,
  );
  assert.equal((await projectState()).progress, 50);
  const subtask = await call("tasks", "POST", {
    project_id: id,
    parent_id: development.id,
    title: "Subtask",
  });
  assert.equal(subtask.status, 201);
  assert.equal(
    (await projectState()).progress,
    50,
    "subtasks must not count twice",
  );
  const extra = await call("tasks", "POST", {
    project_id: id,
    phase: "Entwicklung",
    title: "Second development task",
  });
  assert.equal(extra.status, 201);
  assert.equal((await projectState()).progress, 25);
  const contact = await call("users", "POST", {
    name: "Progress contact",
    email: "progress@customer.test",
    customer_id: customerA,
  });
  const customerCookie = `ops_session=${await createSession(contact.body.id)}`;
  assert.equal(
    (await projectState(customerCookie)).progress,
    25,
    "portal uses full aggregate even when tasks are internal",
  );
  assert.equal(
    (
      await call(
        `projects/${id}`,
        "PATCH",
        { phase_weights: defaultPhaseWeights },
        customerCookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (await call(`tasks/${extra.body.id}`, "PATCH", { phase: "Unknown" }))
      .status,
    400,
  );
  assert.equal(
    (await call(`tasks/${development.id}`, "PATCH", { phase: "Design" }))
      .status,
    200,
  );
  assert.equal(
    sql.prepare("SELECT phase FROM tasks WHERE id=?").get(subtask.body.id)
      .phase,
    "Design",
  );
  for (const invalid of [
    { ...weights, Design: 5 },
    { ...weights, Design: -1, Entwicklung: 51 },
    { ...weights, Design: "0" },
    {},
    null,
  ]) {
    assert.equal(
      (await call(`projects/${id}`, "PATCH", { phase_weights: invalid }))
        .status,
      400,
    );
  }
  assert.deepEqual((await projectState()).phase_weights, weights);
});

test("v1.1 inline customer creation is atomic with its project", async () => {
  const customerCount = () =>
    sql.prepare("SELECT count(*) n FROM customers").get().n;
  const before = customerCount();
  const invalid = await call("projects", "POST", {
    new_customer: { name: "Should not remain" },
    name: "",
    due_date: "2027-12-31",
  });
  assert.equal(invalid.status, 400);
  assert.equal(
    customerCount(),
    before,
    "customer insert rolls back if project creation fails",
  );
  const created = await call("projects", "POST", {
    new_customer: {
      name: "Inline customer",
      logo: "https://example.com/logo.svg",
    },
    name: "Inline project",
    due_date: "2027-12-31",
  });
  assert.equal(created.status, 201);
  const project = sql
    .prepare("SELECT * FROM projects WHERE id=?")
    .get(created.body.id);
  const customer = sql
    .prepare("SELECT * FROM customers WHERE id=?")
    .get(project.customer_id);
  assert.equal(customer.name, "Inline customer");
  assert.equal(customer.logo, "https://example.com/logo.svg");
  assert.equal(customerCount(), before + 1);
  assert.equal(
    (await call("projects", "POST", { new_customer: [], name: "Bad" })).status,
    400,
  );
  assert.equal(
    (
      await call("projects", "POST", {
        new_customer: { name: "Bad" },
        customer_id: customerA,
        name: "Bad",
      })
    ).status,
    400,
  );
});

test("v1.1 migrates existing project phases without changing tasks or documents", async () => {
  const { schema } = await import("../lib/schema.mjs");
  const { initializeDatabase, SqlDatabase } =
    await import("../lib/database.mjs");
  const { createClient } = await import("@libsql/client");
  const { defaultPhaseWeights } = await import("../lib/project-phases.mjs");
  const client = createClient({
    url: `file:${join(temp, "legacy-phases.sqlite")}`,
    intMode: "number",
  });
  const legacy = new SqlDatabase(client);
  try {
    await legacy.exec(schema);
    await legacy
      .prepare(
        "INSERT INTO customers(id,name,initials) VALUES('legacy-c','Legacy','L')",
      )
      .run();
    await legacy
      .prepare(
        "INSERT INTO projects(id,customer_id,name,phase,start_date,due_date) VALUES('legacy-p','legacy-c','Legacy project','Design','2026-01-01','2027-01-01')",
      )
      .run();
    await legacy
      .prepare(
        "INSERT INTO tasks(id,project_id,title,status) VALUES('legacy-t','legacy-p','Entwicklung','done'),('legacy-free','legacy-p','Custom task','progress')",
      )
      .run();
    await legacy
      .prepare(
        "INSERT INTO documents(id,project_id,title,content) VALUES('legacy-d','legacy-p','Keep me','{}')",
      )
      .run();
    await initializeDatabase(legacy);
    await initializeDatabase(legacy);
    const project = await legacy
      .prepare("SELECT * FROM projects WHERE id='legacy-p'")
      .get();
    assert.equal(project.name, "Legacy project");
    assert.equal(project.project_type, "web");
    assert.deepEqual(JSON.parse(project.phase_weights), defaultPhaseWeights);
    assert.equal(
      (await legacy.prepare("SELECT * FROM tasks WHERE id='legacy-t'").get())
        .phase,
      "Entwicklung",
    );
    assert.equal(
      (await legacy.prepare("SELECT * FROM tasks WHERE id='legacy-t'").get())
        .status,
      "done",
    );
    assert.equal(
      (await legacy.prepare("SELECT * FROM tasks WHERE id='legacy-free'").get())
        .phase,
      "Design",
    );
    assert.equal(
      (
        await legacy
          .prepare("SELECT * FROM documents WHERE id='legacy-d'")
          .get()
      ).title,
      "Keep me",
    );
  } finally {
    legacy.close();
  }
});

test("v1.3 recurring SEO projects have no progress or web template tasks", async () => {
  const result = await call("projects", "POST", {
    customer_id: customerA,
    name: "SEO + GEO",
    project_type: "seo_geo",
  });
  assert.equal(result.status, 201);
  const project = (await call("state")).body.projects.find(
    (p) => p.id === result.body.id,
  );
  assert.equal(project.project_type, "seo_geo");
  assert.equal(project.progress, null);
  assert.equal(
    sql
      .prepare("SELECT count(*) n FROM tasks WHERE project_id=?")
      .get(project.id).n,
    0,
  );
  assert.equal(
    (await call(`projects/${project.id}`, "PATCH", { project_type: "unknown" }))
      .status,
    400,
  );
  assert.equal(
    (await call(`projects/${project.id}`, "PATCH", { project_type: "web" }))
      .status,
    200,
  );
  assert.equal(
    (await call("state")).body.projects.find((p) => p.id === project.id)
      .progress,
    0,
  );
});

test("v1.3 PDFs persist in chunks and remain isolated, private and admin-managed", async () => {
  const seo = (
    await call("projects", "POST", {
      customer_id: customerA,
      name: "SEO report project",
      project_type: "seo_geo",
    })
  ).body.id;
  const contact = (
    await call("users", "POST", {
      name: "Report contact",
      email: "reports@customer.test",
      customer_id: customerA,
    })
  ).body.id;
  const other = (
    await call("users", "POST", {
      name: "Other report contact",
      email: "other-reports@customer.test",
      customer_id: customerB,
    })
  ).body.id;
  const ownCookie = `ops_session=${await createSession(contact)}`,
    otherCookie = `ops_session=${await createSession(other)}`;
  const pdf = Buffer.concat([
    Buffer.from("%PDF-1.7\n"),
    Buffer.alloc(800000, 32),
    Buffer.from("\n%%EOF\n"),
  ]);
  async function upload({
    cookie = adminCookie,
    bytes = pdf,
    filename = "report.pdf",
    period = "2026-11",
    project_id = seo,
  } = {}) {
    const form = new FormData();
    form.set("project_id", project_id);
    form.set("title", "Monthly report");
    form.set("period", period);
    form.set("file", new File([bytes], filename, { type: "application/pdf" }));
    return handle(
      new Request("http://localhost:3000/api/reports", {
        method: "POST",
        headers: { origin: "http://localhost:3000", cookie },
        body: form,
      }),
    );
  }
  assert.equal((await upload({ cookie: ownCookie })).status, 403);
  assert.equal(
    (await upload({ bytes: Buffer.from("<html>Not PDF</html>") })).status,
    400,
  );
  assert.equal((await upload({ filename: "report.html" })).status, 400);
  assert.equal((await upload({ period: "2026-13" })).status, 400);
  assert.equal((await upload({ project_id: projectA })).status, 400);
  assert.equal(
    (await upload({ bytes: Buffer.alloc(3 * 1024 * 1024 + 1) })).status,
    413,
  );
  const response = await upload();
  assert.equal(response.status, 201);
  const { id } = await response.json();
  assert.equal(
    sql
      .prepare("SELECT count(*) n FROM report_chunks WHERE report_id=?")
      .get(id).n,
    4,
  );
  const own = (await call("state", "GET", null, ownCookie)).body;
  assert.equal(own.reports.length, 1);
  assert.equal(own.reports[0].id, id);
  assert.equal(Object.hasOwn(own.reports[0], "content"), false);
  assert.equal(
    (await call("state", "GET", null, otherCookie)).body.reports.length,
    0,
  );
  const get = (cookie) =>
    handle(
      new Request(`http://localhost:3000/api/reports/${id}/download`, {
        headers: { cookie },
      }),
    );
  assert.equal((await get("")).status, 401);
  assert.equal((await get(otherCookie)).status, 404);
  await closeDatabase();
  const download = await get(ownCookie);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("content-type"), "application/pdf");
  assert.equal(download.headers.get("cache-control"), "private, no-store");
  assert.match(download.headers.get("content-disposition"), /^attachment;/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  assert.equal(
    (await call(`reports/${id}`, "DELETE", null, ownCookie)).status,
    403,
  );
  assert.equal((await call(`users/${contact}`, "DELETE")).status, 200);
  assert.equal(
    (await get(ownCookie)).status,
    401,
    "revoking a contact revokes PDF access",
  );
  assert.equal((await call(`reports/${id}`, "DELETE")).status, 200);
  assert.equal(
    sql
      .prepare("SELECT count(*) n FROM report_chunks WHERE report_id=?")
      .get(id).n,
    0,
  );
  assert.equal((await get(adminCookie)).status, 404);
});

test("v1.4 onboarding saves scoped drafts, rejects conflicts and creates one shared document", async () => {
  const { accessItems } = await import("../lib/onboarding.mjs");
  const path = `onboardings/${projectA}`;
  assert.equal(
    (
      await call(
        `onboardings/${projectB}`,
        "PATCH",
        { expected_revision: 0, step: 0, answers: {} },
        cookieA,
      )
    ).status,
    404,
  );
  assert.equal(
    (await call(path, "PATCH", { step: 0, answers: {} }, cookieA)).status,
    400,
  );
  const draft = await call(
    path,
    "PATCH",
    { expected_revision: 0, step: 1, answers: { company: "Customer company" } },
    cookieA,
  );
  assert.equal(draft.status, 200);
  assert.equal(draft.body.revision, 1);
  let state = (await call("state", "GET", null, cookieA)).body;
  assert.equal(
    state.onboardings.find((row) => row.project_id === projectA).status,
    "draft",
  );
  assert.equal(
    state.onboardings.find((row) => row.project_id === projectA).answers
      .company,
    "Customer company",
  );
  const conflicts = await Promise.all([
    call(
      path,
      "PATCH",
      { expected_revision: 1, step: 1, answers: { company: "First draft" } },
      cookieA,
    ),
    call(
      path,
      "PATCH",
      { expected_revision: 1, step: 1, answers: { company: "Second draft" } },
      cookieA,
    ),
  ]);
  assert.deepEqual(conflicts.map((r) => r.status).sort(), [200, 409]);
  const answers = {
    company: "Customer company",
    contact_name: "Contact A",
    contact_email: "a@customer.test",
    website: "https://example.com",
    platform: "WordPress",
    goals: "More enquiries",
    services: "Design services",
    audience: "Local businesses",
    confirmed: true,
    accesses: Object.fromEntries(
      accessItems("web").map((item) => [
        item.id,
        { status: "invited", note: "Sent by contact A" },
      ]),
    ),
  };
  assert.equal(
    (
      await call(
        path,
        "PATCH",
        {
          expected_revision: 2,
          step: 4,
          complete: true,
          answers: { ...answers, confirmed: false },
        },
        cookieA,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        path,
        "PATCH",
        {
          expected_revision: 2,
          step: 4,
          complete: true,
          answers: { ...answers, website: "javascript:alert(1)" },
        },
        cookieA,
      )
    ).status,
    400,
  );
  const completions = await Promise.all([
    call(
      path,
      "PATCH",
      { expected_revision: 2, step: 4, complete: true, answers },
      cookieA,
    ),
    call(
      path,
      "PATCH",
      { expected_revision: 2, step: 4, complete: true, answers },
      cookieA,
    ),
  ]);
  const completed = completions[0];
  assert.equal(completions[1].status, 200);
  assert.equal(completions[1].body.document_id, completed.body.document_id);
  assert.equal(completed.status, 200);
  assert.equal(completed.body.completed, true);
  const document = sql
    .prepare("SELECT * FROM documents WHERE id=?")
    .get(completed.body.document_id);
  assert.equal(document.visible, 1);
  assert.equal(document.project_id, projectA);
  assert.match(document.content, /More enquiries/);
  assert.match(document.content, /Nexene muss die Zugriffe noch prüfen/);
  const repeated = await call(
    path,
    "PATCH",
    { expected_revision: 2, step: 4, complete: true, answers },
    cookieA,
  );
  assert.equal(repeated.body.document_id, document.id);
  assert.equal(
    sql
      .prepare(
        "SELECT count(*) n FROM documents WHERE title=? AND project_id=?",
      )
      .get("Onboarding: Project A", projectA).n,
    1,
  );
  const own = (await call("state", "GET", null, cookieA)).body;
  assert.equal(
    own.onboardings.find((row) => row.project_id === projectA).status,
    "completed",
  );
  assert.ok(own.documents.some((row) => row.id === document.id));
});

test("v1.4 SEO onboarding includes local profiles conditionally and preserves drafts on failed completion", async () => {
  const { accessItems } = await import("../lib/onboarding.mjs");
  assert.ok(
    accessItems("seo_geo", true).some((item) => item.id === "business_profile"),
  );
  assert.equal(
    accessItems("seo_geo", false).some(
      (item) => item.id === "business_profile",
    ),
    false,
  );
  assert.equal(
    accessItems("seo_geo").some((item) => item.id === "hosting"),
    false,
  );
  const project = (
    await call("projects", "POST", {
      customer_id: customerA,
      name: "SEO onboarding",
      project_type: "seo_geo",
    })
  ).body.id;
  const draft = await call(
    `onboardings/${project}`,
    "PATCH",
    { expected_revision: 0, step: 0, answers: { company: "SEO company" } },
    cookieA,
  );
  assert.equal(draft.status, 200);
  const invalid = await call(
    `onboardings/${project}`,
    "PATCH",
    {
      expected_revision: 1,
      step: 4,
      complete: true,
      answers: { company: "SEO company" },
    },
    cookieA,
  );
  assert.equal(invalid.status, 400);
  const saved = sql
    .prepare("SELECT * FROM onboardings WHERE project_id=?")
    .get(project);
  assert.equal(saved.revision, 1);
  assert.equal(saved.status, "draft");
  assert.equal(saved.document_id, null);
});

test("v1.5 admin project deletion removes its entire graph and preserves customer and other projects", async () => {
  const id = (
    await call("projects", "POST", {
      customer_id: customerA,
      name: "Delete only this project",
      project_type: "seo_geo",
    })
  ).body.id;
  const root = (
    await call("tasks", "POST", {
      project_id: id,
      title: "Root",
      due_date: "2027-12-01",
      recurrence: "weekly",
    })
  ).body.id;
  const child = (
    await call("tasks", "POST", {
      project_id: id,
      parent_id: root,
      title: "Child",
    })
  ).body.id;
  await call(`tasks/${root}`, "PATCH", { status: "done" });
  await call("comments", "POST", {
    task_id: root,
    body: "Delete this comment",
  });
  await call("attachments", "POST", {
    task_id: child,
    title: "Linked attachment",
    url: "https://example.com",
  });
  const doc = (
    await call("documents", "POST", { project_id: id, title: "Parent" })
  ).body.id;
  await call("documents", "POST", {
    project_id: id,
    parent_id: doc,
    title: "Nested document",
  });
  await call("resources", "POST", {
    project_id: id,
    title: "Resource",
    url: "https://example.com",
  });
  await call("time", "POST", {
    project_id: id,
    date: "2026-11-10",
    minutes: 60,
  });
  await call("approvals", "POST", {
    project_id: id,
    title: "Approval",
    reference: "Version 1",
  });
  const storage = await (await import("../lib/database.mjs")).database();
  await storage
    .prepare("INSERT INTO onboardings(project_id,document_id) VALUES(?,?)")
    .run(id, doc);
  await storage
    .prepare(
      "INSERT INTO reports(id,project_id,title,period,file_name,size) VALUES('delete-report',?,'Delete report','2026-11','report.pdf',1)",
    )
    .run(id);
  await storage
    .prepare("INSERT INTO report_chunks VALUES('delete-report',0,?)")
    .run(Buffer.from([1]));
  const customerBefore = sql
    .prepare("SELECT * FROM customers WHERE id=?")
    .get(customerA);
  const otherBefore = sql
    .prepare("SELECT * FROM projects WHERE id=?")
    .get(projectA);
  const taskIds = sql
    .prepare("SELECT id FROM tasks WHERE project_id=?")
    .all(id)
    .map((r) => r.id);
  assert.equal(
    (await call(`projects/${id}`, "DELETE", null, cookieA)).status,
    403,
  );
  assert.equal((await call(`projects/${id}`, "DELETE")).status, 200);
  for (const table of [
    "projects",
    "tasks",
    "documents",
    "resources",
    "approvals",
    "time_entries",
    "reports",
    "onboardings",
  ]) {
    const column = table === "projects" ? "id" : "project_id";
    assert.equal(
      sql.prepare(`SELECT count(*) n FROM ${table} WHERE ${column}=?`).get(id)
        .n,
      0,
      table,
    );
  }
  for (const taskId of taskIds) {
    assert.equal(
      sql.prepare("SELECT count(*) n FROM comments WHERE task_id=?").get(taskId)
        .n,
      0,
    );
    assert.equal(
      sql
        .prepare("SELECT count(*) n FROM attachments WHERE task_id=?")
        .get(taskId).n,
      0,
    );
    assert.equal(
      sql
        .prepare(
          "SELECT count(*) n FROM task_recurrences WHERE source_id=? OR next_id=?",
        )
        .get(taskId, taskId).n,
      0,
    );
  }
  assert.equal(
    sql
      .prepare(
        "SELECT count(*) n FROM report_chunks WHERE report_id='delete-report'",
      )
      .get().n,
    0,
  );
  assert.deepEqual(
    sql.prepare("SELECT * FROM customers WHERE id=?").get(customerA),
    customerBefore,
  );
  assert.deepEqual(
    sql.prepare("SELECT * FROM projects WHERE id=?").get(projectA),
    otherBefore,
  );
  assert.deepEqual(sql.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal((await call(`projects/${id}`, "DELETE")).status, 404);
});

test("v1.6 records successful login, edits and deletes access while preserving history", async () => {
  const id = (
    await call("users", "POST", {
      name: "Access test",
      email: "access-test@customer.test",
      customer_id: customerA,
    })
  ).body.id;
  let user = (await call("state")).body.users.find((u) => u.id === id);
  assert.equal(user.login_state, "never");
  assert.equal(user.last_login_at, null);
  const token = await issueLogin(user.email);
  assert.equal(
    (await call("state")).body.users.find((u) => u.id === id).last_login_at,
    null,
  );
  const verified = await call("auth/verify", "POST", { token });
  assert.equal(verified.status, 200);
  const cookie = verified.response.headers.get("set-cookie").split(";")[0];
  user = (await call("state")).body.users.find((u) => u.id === id);
  assert.equal(user.login_state, "tracked");
  assert.ok(user.last_login_at);
  const timestamp = user.last_login_at;
  await call("state", "GET", null, cookie);
  assert.equal(
    (await call("state")).body.users.find((u) => u.id === id).last_login_at,
    timestamp,
  );
  assert.equal(
    (
      await call(`users/${id}`, "PATCH", {
        name: "Renamed",
        expected_revision: user.revision,
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("state", "GET", null, cookie)).status,
    200,
    "name-only edits preserve sessions",
  );
  assert.equal(
    (
      await call(`users/${id}`, "PATCH", {
        name: "Stale",
        expected_revision: user.revision,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`users/${id}`, "PATCH", {
        email: "changed@customer.test",
        customer_id: customerB,
      })
    ).status,
    200,
  );
  assert.equal((await call("state", "GET", null, cookie)).status, 401);
  assert.equal(await issueLogin("access-test@customer.test"), null);
  assert.equal(
    (await call(`users/${id}`, "PATCH", { role: "admin" })).status,
    200,
  );
  const assigned = (
    await call("tasks", "POST", {
      project_id: projectA,
      title: "Assignment",
      assignee_id: id,
    })
  ).body.id;
  assert.equal((await call(`users/${id}`, "DELETE")).status, 200);
  assert.equal(
    (await call("state")).body.users.some((u) => u.id === id),
    false,
  );
  assert.ok(
    sql.prepare("SELECT deleted_at FROM users WHERE id=?").get(id).deleted_at,
  );
  assert.equal(
    sql.prepare("SELECT assignee_id FROM tasks WHERE id=?").get(assigned)
      .assignee_id,
    null,
  );
  assert.equal(await issueLogin("changed@customer.test"), null);
  const restored = await call("users", "POST", {
    name: "Restored",
    email: "changed@customer.test",
    customer_id: customerA,
  });
  assert.equal(restored.status, 201);
  assert.equal(restored.body.id, id);
  assert.equal((await call(`users/${admin.id}`, "DELETE")).status, 403);
  assert.equal(
    (
      await call(`users/${admin.id}`, "PATCH", {
        role: "customer",
        customer_id: customerA,
      })
    ).status,
    403,
  );
  assert.equal(
    (await call(`users/${id}`, "PATCH", { name: "Forbidden" }, cookieA)).status,
    403,
  );
});

test("v1.6 changed or deleted bootstrap accounts do not reappear on cold initialization", async () => {
  const { database, initializeDatabase } = await import("../lib/database.mjs");
  const storage = await database(),
    previous = process.env.ADMIN_EMAILS;
  try {
    process.env.ADMIN_EMAILS = "bootstrap-test@nexene.test";
    await initializeDatabase(storage);
    const target = sql
      .prepare("SELECT * FROM users WHERE email=?")
      .get(process.env.ADMIN_EMAILS);
    assert.equal(
      (
        await call(`users/${target.id}`, "PATCH", {
          email: "bootstrap-changed@nexene.test",
        })
      ).status,
      200,
    );
    await initializeDatabase(storage);
    assert.equal(
      sql
        .prepare("SELECT id FROM users WHERE email=?")
        .get("bootstrap-test@nexene.test"),
      undefined,
    );
    assert.equal((await call(`users/${target.id}`, "DELETE")).status, 200);
    await initializeDatabase(storage);
    assert.equal(
      (await call("state")).body.users.some((u) => u.id === target.id),
      false,
    );
  } finally {
    process.env.ADMIN_EMAILS = previous;
  }
});

test("v1.6 concurrent admins cannot delete one another or remove the final admin", async () => {
  const { createClient } = await import("@libsql/client");
  const { SqlDatabase, initializeDatabase } =
    await import("../lib/database.mjs");
  const { manageUser } = await import("../lib/user-management.mjs");
  const isolated = new SqlDatabase(
    createClient({ url: "file:" + join(temp, "admin-guard.sqlite") }),
  );
  try {
    await initializeDatabase(isolated);
    const first = await isolated
      .prepare("SELECT * FROM users WHERE role='admin'")
      .get();
    const second = await manageUser(isolated, first, null, "POST", {
      name: "Other admin",
      email: "guard@nexene.test",
      role: "admin",
    });
    const results = await Promise.allSettled([
      manageUser(isolated, first, second.id, "DELETE"),
      manageUser(isolated, { id: second.id }, first.id, "DELETE"),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      (
        await isolated
          .prepare(
            "SELECT count(*) n FROM users WHERE role='admin' AND deleted_at IS NULL",
          )
          .get()
      ).n,
      1,
    );
    const remaining = await isolated
      .prepare("SELECT * FROM users WHERE role='admin' AND deleted_at IS NULL")
      .get();
    await assert.rejects(
      manageUser(isolated, remaining, remaining.id, "DELETE"),
      { status: 403 },
    );
  } finally {
    isolated.close();
  }
});

after(async () => {
  await closeDatabase();
  sql.close();
  rmSync(temp, { recursive: true, force: true });
});
