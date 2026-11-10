// Run only against an isolated development instance, never production data.
import { chromium } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { mkdirSync, existsSync } from "node:fs";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
if (!process.env.TEST_DATA_DIR)
  throw new Error(
    "TEST_DATA_DIR must point at an isolated development database",
  );
const sql = new DatabaseSync(resolve(process.env.TEST_DATA_DIR, "ops.sqlite"));
const admin = sql
  .prepare("SELECT id FROM users WHERE role='admin' LIMIT 1")
  .get();
const token = randomBytes(32).toString("hex");
sql
  .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
  .run(
    createHash("sha256").update(token).digest("hex"),
    admin.id,
    Date.now() + 60000,
  );
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium")
      ? "/usr/bin/chromium"
      : chromium.executablePath()),
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const suffix = randomBytes(4).toString("hex"),
    taskTitle = `Browser smoke task ${suffix}`,
    docTitle = `Browser document ${suffix}`;
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1050 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/?token=${token}`);
  await page
    .getByRole("heading", { name: "Alles im Blick.", exact: true })
    .waitFor();
  assert.equal(new URL(page.url()).searchParams.has("token"), false);
  const output =
    process.env.TEST_SCREENSHOTS || resolve("test-results", "screenshots");
  mkdirSync(output, { recursive: true });
  await page.screenshot({
    path: resolve(output, "dashboard.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Aufgaben", exact: false })
    .first()
    .click();
  for (const name of ["Board", "Kalender", "Zeitplan", "Liste"]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  await page.getByRole("button", { name: "Neue Aufgabe", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titel", { exact: true }).fill(taskTitle);
  await dialog.getByRole("button", { name: "Erstellen", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText(taskTitle, { exact: true }).click();
  await page.getByRole("heading", { name: taskTitle }).waitFor();
  await page.locator(".drawer-heading button").click();
  await page
    .getByRole("button", { name: "Dokumente", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Neue Seite", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Titel", { exact: true })
    .fill(docTitle);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Erstellen", exact: true })
    .click();
  await page.locator(".tiptap").waitFor();
  await page
    .locator(".tiptap")
    .fill("Persistent content from browser smoke test.");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page
    .getByRole("button", { name: "Speichern", exact: true })
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.querySelector(".document-top .primary")?.disabled,
  );
  await page.screenshot({
    path: resolve(output, "document.png"),
    fullPage: true,
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Dokumente", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: docTitle, exact: true })
    .last()
    .click();
  await page
    .getByText("Persistent content from browser smoke test.", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Sprache wechseln: Englisch", exact: true })
    .click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Your project overview.",
      exact: true,
    })
    .waitFor();
  const state = await page.evaluate(
    async () => await (await fetch("/api/state")).json(),
  );
  const project = state.projects[0];
  const post = async (path, body) =>
    page.evaluate(
      async ({ path, body }) => {
        const r = await fetch(`/api/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      },
      { path, body },
    );
  const customer = await post("users", {
    name: "Test Customer",
    email: `customer-${suffix}@nexene.test`,
    role: "customer",
    customer_id: project.customer_id,
  });
  await post("approvals", {
    project_id: project.id,
    title: `Design approval ${suffix}`,
    reference: "Test snapshot v1",
  });
  const customerToken = randomBytes(32).toString("hex");
  sql
    .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
    .run(
      createHash("sha256").update(customerToken).digest("hex"),
      customer.id,
      Date.now() + 60000,
    );
  const customerPage = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  customerPage.on("pageerror", (e) => errors.push(e.message));
  await customerPage.goto(`${base}/?token=${customerToken}`);
  await customerPage.locator(".portal-project-heading h1").waitFor();
  assert.equal(await customerPage.locator(".sidebar").count(), 0);
  assert.equal(await customerPage.locator(".back-button").count(), 0);
  assert.equal(await customerPage.locator(".search-row").count(), 0);
  await customerPage
    .locator(".project-tabs")
    .getByRole("button", { name: "Offene Freigaben", exact: true })
    .click();
  const approval = customerPage
    .locator(".approval-card")
    .filter({ hasText: `Design approval ${suffix}` });
  await approval
    .getByRole("button", { name: "Freigeben", exact: true })
    .click();
  await customerPage
    .getByRole("dialog")
    .getByRole("button", { name: "Freigeben", exact: true })
    .click();
  await approval.getByText("Freigegeben", { exact: true }).waitFor();
  await customerPage.screenshot({
    path: resolve(output, "customer-portal.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: magic login, dashboard, all task views, task creation, document save/reload, DE/EN.",
  );
} finally {
  sql.close();
  await browser.close();
}
