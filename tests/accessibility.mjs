import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
const base = process.env.TEST_BASE_URL;
if (!base || !process.env.TEST_DATA_DIR)
  throw new Error("Use npm run test:browser with an isolated database");
const sql = new DatabaseSync(resolve(process.env.TEST_DATA_DIR, "ops.sqlite"));
const user = sql
  .prepare("SELECT id FROM users WHERE role='admin' LIMIT 1")
  .get();
function loginToken(userId = user.id) {
  const token = randomBytes(32).toString("hex");
  sql
    .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
    .run(
      createHash("sha256").update(token).digest("hex"),
      userId,
      Date.now() + 60000,
    );
  return token;
}
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium")
      ? "/usr/bin/chromium"
      : chromium.executablePath()),
  headless: true,
  args: ["--no-sandbox"],
});
const failures = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const scan = async (name, target = page) => {
    await page.waitForTimeout(150);
    const result = await new AxeBuilder({ page: target })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    for (const violation of result.violations)
      failures.push({
        page: name,
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      });
    console.log(
      `Accessibility ${name}: ${result.violations.length} violations`,
    );
  };
  await page.goto(base);
  await page
    .getByRole("button", { name: "Anmeldelink senden", exact: true })
    .waitFor();
  await scan("login");
  await page.goto(`${base}/?token=${loginToken()}`);
  await page
    .getByRole("heading", { name: "Alles im Blick.", exact: true })
    .waitFor();
  await scan("dashboard");
  await page.getByRole("button", { name: "Kunden", exact: true }).click();
  await scan("customers");
  await page
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await scan("settings");
  await page.getByRole("button", { name: "Aufgaben", exact: true }).click();
  await scan("task list");
  const create = page.getByRole("button", {
    name: "Neue Aufgabe",
    exact: true,
  });
  await create.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  await scan("task dialog");
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document
          .querySelector("dialog[open]")
          ?.contains(document.activeElement),
      ),
      true,
      "Tab must stay within the modal",
    );
  }
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(
    await create.evaluate((el) => el === document.activeElement),
    true,
    "Focus must return to trigger",
  );
  await create.click();
  await page
    .getByRole("dialog")
    .getByLabel("Titel", { exact: true })
    .fill("Retained after failed save");
  await page.route(
    "**/api/tasks",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Temporärer Fehler. Bitte erneut versuchen.",
        }),
      }),
    { times: 1 },
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Erstellen", exact: true })
    .click();
  await page.locator(".modal .error[role=alert]").waitFor();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByLabel("Titel", { exact: true })
      .inputValue(),
    "Retained after failed save",
  );
  await scan("failed task submission");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await scan("board");
  const card = page.locator(".board-card").first();
  await card.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  await scan("task drawer");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Kalender", exact: true }).click();
  await scan("calendar");
  await page.getByRole("button", { name: "Zeitplan", exact: true }).click();
  await scan("timeline");
  await page
    .getByRole("button", { name: "Dokumente", exact: true })
    .first()
    .click();
  await page.locator(".doc-item").first().click();
  await page.locator(".tiptap").waitFor();
  await scan("document editor");
  // Two tabs use the same saved revision; the second save must preserve its draft.
  const docId = await page.evaluate(async () => {
    const s = await (await fetch("/api/state")).json();
    return s.documents[0].id;
  });
  await page.goto(`${base}/?doc=${docId}`);
  await page.locator(".tiptap").waitFor();
  const second = await page.context().newPage();
  await second.goto(`${base}/?doc=${docId}`);
  await second.locator(".tiptap").waitFor();
  await page.locator(".tiptap").fill("First editor committed version");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".document-top .primary")?.disabled,
  );
  await second.locator(".tiptap").fill("Second editor retained draft");
  await second.getByRole("button", { name: "Speichern", exact: true }).click();
  await second.locator(".document-main .error[role=alert]").waitFor();
  assert.equal(
    (await second.locator(".tiptap").innerText()).trim(),
    "Second editor retained draft",
  );
  const persisted = await page.evaluate(async (id) => {
    const s = await (await fetch("/api/state")).json();
    return JSON.stringify(s.documents.find((d) => d.id === id).content);
  }, docId);
  assert.ok(persisted.includes("First editor committed version"));
  assert.equal(persisted.includes("Second editor retained draft"), false);
  await second.close();
  await page.getByRole("button", { name: "Übersicht", exact: true }).click();
  await page.setViewportSize({ width: 800, height: 1000 });
  await scan("narrow dashboard");
  const contact = sql
    .prepare(
      "SELECT id FROM users WHERE role='customer' AND customer_id IS NOT NULL LIMIT 1",
    )
    .get();
  const customerContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
    }),
    customerPage = await customerContext.newPage();
  await customerPage.goto(`${base}/?token=${loginToken(contact.id)}`);
  await customerPage.locator(".portal-project-heading h1").waitFor();
  assert.equal(
    await customerPage.locator(".sidebar,.back-button,.search-row").count(),
    0,
  );
  await scan("customer project", customerPage);
  await customerPage.setViewportSize({ width: 800, height: 1000 });
  await scan("narrow customer project", customerPage);
  await customerContext.close();
  if (failures.length) console.error(JSON.stringify(failures, null, 2));
  assert.deepEqual(failures, [], "WCAG automated checks must pass");
  console.log(
    "Keyboard containment, Escape, focus restoration, failed-save recovery and concurrent-document protection passed.",
  );
} finally {
  sql.close();
  await browser.close();
}
