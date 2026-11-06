import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync, backup } from "node:sqlite";
const temp = mkdtempSync(join(tmpdir(), "nexene-test-"));
process.env.DATA_DIR = temp;
process.env.ADMIN_EMAILS = "admin@nexene.test";
process.env.APP_URL = "http://localhost:3000";
process.env.SEED_DEMO = "false";
const { handle } = await import("../lib/api.mjs");
const { db, uid } = await import("../lib/db.mjs");
const { createSession, issueLogin, redeemLogin } =
  await import("../lib/auth.mjs");
const sql = db(),
  admin = sql.prepare("SELECT * FROM users WHERE role='admin'").get(),
  adminCookie = `ops_session=${createSession(admin.id)}`;
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
  cookieA = `ops_session=${createSession(userA)}`;
  cookieB = `ops_session=${createSession(userB)}`;
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
  const row = sql.prepare("SELECT * FROM approvals WHERE id=?").get(id);
  assert.equal(row.decision_by, userA);
  assert.ok(row.decision_at);
});
test("magic links are single-use, expiring and restricted to known addresses", () => {
  assert.equal(issueLogin("unknown@customer.test"), null);
  const token = issueLogin("a@customer.test");
  assert.ok(token);
  assert.equal(redeemLogin(token), userA);
  assert.equal(redeemLogin(token), undefined);
  const expired = issueLogin("a@customer.test");
  sql.prepare("UPDATE auth_tokens SET expires=0").run();
  assert.equal(redeemLogin(expired), undefined);
  for (let i = 0; i < 5; i++) issueLogin("admin@nexene.test");
  assert.equal(issueLogin("admin@nexene.test"), null);
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
  const all = sql
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
    sql
      .prepare(
        "SELECT due_date FROM tasks WHERE title='Monthly report' AND status='todo'",
      )
      .get().due_date,
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
  assert.equal(issueLogin("b@customer.test"), null);
  assert.deepEqual(
    (await call("state", "GET", null, `ops_session=${createSession(userB)}`))
      .body.projects,
    [],
  );
});
test("SQLite online backup restores customers, projects and tasks into a clean database", async () => {
  const file = join(temp, "restore.sqlite");
  await backup(sql, file);
  const restored = new DatabaseSync(file);
  assert.equal(
    restored.prepare("PRAGMA integrity_check").get().integrity_check,
    "ok",
  );
  assert.equal(
    restored.prepare("SELECT COUNT(*) count FROM customers").get().count,
    2,
  );
  assert.equal(
    restored.prepare("SELECT name FROM projects WHERE id=?").get(projectA).name,
    "Project A",
  );
  assert.ok(
    restored.prepare("SELECT id FROM tasks WHERE id=?").get(visibleTask),
  );
  restored.close();
});
after(() => {
  sql.close();
  rmSync(temp, { recursive: true, force: true });
});
